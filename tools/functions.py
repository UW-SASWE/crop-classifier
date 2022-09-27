#####################
##### Functions #####
#####################
import ee


#Function to convert from dB
def toNatural(img):
    return ee.Image(10.0).pow(img.select(0).divide(10.0))

# Function to convert to dB
def toDB(img):
    return ee.Image(img).log10().multiply(10.0)

#Apllying a Refined Lee Speckle filter as coded in the SNAP 3.0 S1TBX:
#https:#github.com/senbox-org/s1tbx/blob/master/s1tbx-op-sar-processing/src/main/java/org/esa/s1tbx/sar/gpf/filtering/SpeckleFilters/RefinedLee.java
def RefinedLee(img):
  # img must be in natural units, i.e. not in dB!
    # Set up 3x3 kernels

    # convert to natural.. do not apply function on dB!
    myimg = toNatural(img)

    weights3 = ee.List.repeat(ee.List.repeat(1,3),3)
    kernel3 = ee.Kernel.fixed(3,3, weights3, 1, 1, False)

    mean3 = myimg.reduceNeighborhood(ee.Reducer.mean(), kernel3)
    variance3 = myimg.reduceNeighborhood(ee.Reducer.variance(), kernel3)

    # Use a sample of the 3x3 windows inside a 7x7 windows to determine gradients and directions
    sample_weights = ee.List([[0,0,0,0,0,0,0], [0,1,0,1,0,1,0],[0,0,0,0,0,0,0], [0,1,0,1,0,1,0], [0,0,0,0,0,0,0], [0,1,0,1,0,1,0],[0,0,0,0,0,0,0]])

    sample_kernel = ee.Kernel.fixed(7,7, sample_weights, 3,3, False)

    # Calculate mean and variance for the sampled windows and store as 9 bands
    sample_mean = mean3.neighborhoodToBands(sample_kernel)
    sample_var = variance3.neighborhoodToBands(sample_kernel)

    # Determine the 4 gradients for the sampled windows
    gradients = sample_mean.select(1).subtract(sample_mean.select(7)).abs()
    gradients = gradients.addBands(sample_mean.select(6).subtract(sample_mean.select(2)).abs())
    gradients = gradients.addBands(sample_mean.select(3).subtract(sample_mean.select(5)).abs())
    gradients = gradients.addBands(sample_mean.select(0).subtract(sample_mean.select(8)).abs())

    # And find the maximum gradient amongst gradient bands
    max_gradient = gradients.reduce(ee.Reducer.max())

    # Create a mask for band pixels that are the maximum gradient
    gradmask = gradients.eq(max_gradient)

    # duplicate gradmask bands: each gradient represents 2 directions
    gradmask = gradmask.addBands(gradmask)

    # Determine the 8 directions
    directions = sample_mean.select(1).subtract(sample_mean.select(4)).gt(sample_mean.select(4).subtract(sample_mean.select(7))).multiply(1)
    directions = directions.addBands(sample_mean.select(6).subtract(sample_mean.select(4)).gt(sample_mean.select(4).subtract(sample_mean.select(2))).multiply(2))
    directions = directions.addBands(sample_mean.select(3).subtract(sample_mean.select(4)).gt(sample_mean.select(4).subtract(sample_mean.select(5))).multiply(3))
    directions = directions.addBands(sample_mean.select(0).subtract(sample_mean.select(4)).gt(sample_mean.select(4).subtract(sample_mean.select(8))).multiply(4))
    # The next 4 are the not() of the previous 4
    directions = directions.addBands(directions.select(0).Not().multiply(5))
    directions = directions.addBands(directions.select(1).Not().multiply(6))
    directions = directions.addBands(directions.select(2).Not().multiply(7))
    directions = directions.addBands(directions.select(3).Not().multiply(8))

    # Mask all values that are not 1-8
    directions = directions.updateMask(gradmask)

    # "collapse" the stack into a singe band image (due to masking, each pixel has just one value (1-8) in it's directional band, and is otherwise masked)
    directions = directions.reduce(ee.Reducer.sum())

    sample_stats = sample_var.divide(sample_mean.multiply(sample_mean))

    # Calculate localNoiseVariance
    sigmaV = sample_stats.toArray().arraySort().arraySlice(0,0,5).arrayReduce(ee.Reducer.mean(), [0])

    # Set up the 7*7 kernels for directional statistics
    rect_weights = ee.List.repeat(ee.List.repeat(0,7),3).cat(ee.List.repeat(ee.List.repeat(1,7),4))

    diag_weights = ee.List([[1,0,0,0,0,0,0], [1,1,0,0,0,0,0], [1,1,1,0,0,0,0],
    [1,1,1,1,0,0,0], [1,1,1,1,1,0,0], [1,1,1,1,1,1,0], [1,1,1,1,1,1,1]])

    rect_kernel = ee.Kernel.fixed(7,7, rect_weights, 3, 3, False)
    diag_kernel = ee.Kernel.fixed(7,7, diag_weights, 3, 3, False)

    # Create stacks for mean and variance using the original kernels. Mask with relevant direction.
    dir_mean = myimg.reduceNeighborhood(ee.Reducer.mean(), rect_kernel).updateMask(directions.eq(1))
    dir_var = myimg.reduceNeighborhood(ee.Reducer.variance(), rect_kernel).updateMask(directions.eq(1))

    dir_mean = dir_mean.addBands(myimg.reduceNeighborhood(ee.Reducer.mean(), diag_kernel).updateMask(directions.eq(2)))
    dir_= dir_var.addBands(myimg.reduceNeighborhood(ee.Reducer.variance(), diag_kernel).updateMask(directions.eq(2)))

    # and add the bands for rotated kernels
    for i in range(1, 4):
        dir_mean = dir_mean.addBands(myimg.reduceNeighborhood(ee.Reducer.mean(), rect_kernel.rotate(i)).updateMask(directions.eq(2*i+1)))
        dir_= dir_var.addBands(myimg.reduceNeighborhood(ee.Reducer.variance(), rect_kernel.rotate(i)).updateMask(directions.eq(2*i+1)))
        dir_mean = dir_mean.addBands(myimg.reduceNeighborhood(ee.Reducer.mean(), diag_kernel.rotate(i)).updateMask(directions.eq(2*i+2)))
        dir_= dir_var.addBands(myimg.reduceNeighborhood(ee.Reducer.variance(), diag_kernel.rotate(i)).updateMask(directions.eq(2*i+2)))

    # "collapse" the stack into a single band image (due to masking, each pixel has just one value in it's directional band, and is otherwise masked)
    dir_mean = dir_mean.reduce(ee.Reducer.sum())
    dir_= dir_var.reduce(ee.Reducer.sum())

    # A finally generate the filtered value
    varX = dir_var.subtract(dir_mean.multiply(dir_mean).multiply(sigmaV)).divide(sigmaV.add(1.0))

    b = varX.divide(dir_var)

    result = dir_mean.add(b.multiply(myimg.subtract(dir_mean)))
    #return(result)
    return(img.select([]).addBands(ee.Image(toDB(result.arrayGet(0))).rename("VH")))

def bufferPoly(feature):
    return feature#.buffer(20);   # substitute in your value of Z here

# classifyCrop()
##### main #####

def classifyCrop(
    datacrop_combined,
    bdForests,
    seasonDict,
    roi,
    Map, # geemap.map object
    inpDate_Start=2021,
    seasonSelect='Aman (Aug-Dec)'
    ):
    # startdate = startdate = ee.Date.fromYMD(inpDate_Start.getValue()-1,12,1)
    # enddate   = ee.Date.fromYMD(inpDate_Start.getValue()-0,11,25)
    startdate = startdate = ee.Date.fromYMD(inpDate_Start-1,12,1)
    enddate   = ee.Date.fromYMD(inpDate_Start-0,11,25)

    # TODO: Work on these later when the GUI components are added.
    # maplabel.setValue('Rice Classified Map') # for ' + ee.Date(enddate).format('YYYY-MM').getInfo())
    # presultsLabel.setValue('')

    # col = ee.ImageCollection('COPERNICUS/S1_GRD') \
    #             .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH')) \
    #             .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV')) \
    #             .filter(ee.Filter.eq('instrumentMode', 'IW')) \
    #             .filterBounds(BGD) \
    #             .filterDate(startdate,enddate) \
    #             .select(['VH']) \
    #             .map(RefinedLee)

    col = ee.ImageCollection('COPERNICUS/S1_GRD') \
                .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH')) \
                .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV')) \
                .filter(ee.Filter.eq('instrumentMode', 'IW')) \
                .filterBounds(roi) \
                .filterDate(startdate,enddate) \
                .select(['VH']) \
                .map(RefinedLee)

    # create monthly time series
    monList = ee.List.sequence(1,11,1)#.aside(print,'month')
    def monthlyComposite(month):
        # year = inpDate_Start.getValue()-0
        year = inpDate_Start-0
        start = ee.Date.fromYMD(year,month,1)
        end = start.advance(1,"month")
        S1 = col.filterDate(start,end).max()
        return S1

    s1Collection = ee.ImageCollection(monList.map(monthlyComposite))#.aside(print,'S1 collection')
    compositedImage = ee.Image(s1Collection.toList(11).get(0))#Collection
    for i in range(1,11):
        compositedImage = compositedImage.addBands(ee.Image(s1Collection.toList(11).get(i)).select([0]))

    # mask forests
    def maskInside(image, geometry):
        mask = ee.Image.constant(1).clip(geometry).mask().Not()
        return image.updateMask(mask)
        
    compositedImage = maskInside(compositedImage, bdForests)

    compositeBoro = compositedImage.select(seasonDict[seasonSelect]['months'])#.clip(BGD);# Boro rice(Jan-April)
    compositeAus = compositeBoro#compositedImage.select([4,5,6])#.clip(SA);# Aus rice(May-July)
    compositeAman = compositeBoro#compositedImage.select([7,8,9,10])# ,11].clip(SA);# Aman rice (Aug-Dec)

    #merge, buffer features and pickup random samples for training & validation
    fcBoro = datacrop_combined; #waterBoro.merge(vegetation).merge(Builtup).merge(paddyBoro)
    fcAus = fcBoro#waterBoro.merge(vegetation).merge(Builtup).merge(paddyAus)
    fcAman = fcBoro#waterBoro.merge(vegetation).merge(Builtup).merge(paddyAman)

    buffered_fcBoro = fcBoro.map(bufferPoly)
    buffered_fcAus = fcAus.map(bufferPoly)
    buffered_fcAman = fcAman.map(bufferPoly)

    #Assign random numbers for a test/train split
    fcBoro = buffered_fcBoro.randomColumn('random',2015)
    fcAus = buffered_fcAus.randomColumn('random',2015)
    fcAman = buffered_fcAman.randomColumn('random',2015)

    #create training data
    #Join training samples with bands
    bandsBoro = seasonDict[seasonSelect]['bands'] #['VH','VH_1','VH_2','VH_3'];#Boro season
    bandsAus = bandsBoro#['VH_4','VH_5','VH_6'];#Aus season
    bandsAman = bandsBoro#['VH_7','VH_8','VH_9','VH_10']; #,'VH_11'];#Aman season

    trainingBoro = compositeBoro.select(bandsBoro).sampleRegions(
        collection=fcBoro,
        properties=['class','random'],
        scale=500
        )
    trainingAus = compositeAus.select(bandsAus).sampleRegions(
        collection=fcAus,
        properties=['class','random'],
        scale=500
        )
    trainingAman = compositeAman.select(bandsAman).sampleRegions(
        collection=fcAman,
        properties=['class','random'],
        scale=500
        )

    # # # # #split the training and testing ROI into a 30/70 percent
    trainingAccuracyBoro = trainingBoro.filterMetadata('random','less_than', 0.7)
    trainingAccuracyAus = trainingAus.filterMetadata('random','less_than', 0.7)
    trainingAccuracyAman = trainingAman.filterMetadata('random','less_than', 0.7)

    testingAccuracyBoro = trainingBoro.filterMetadata('random','not_less_than', 0.7)
    testingAccuracyAus = trainingAus.filterMetadata('random','not_less_than', 0.7)
    testingAccuracyAman = trainingAman.filterMetadata('random','not_less_than', 0.7)

    # Train the classifier
    trainingClassifierBoro = ee.Classifier.smileRandomForest(10).train(
        features=trainingAccuracyBoro,
        classProperty='class',
        inputProperties=bandsBoro
        )
    trainingClassifierAus = ee.Classifier.smileRandomForest(10).train(
        features=trainingAccuracyAus,
        classProperty='class',
        inputProperties=bandsAus
        )
    trainingClassifierAman = ee.Classifier.smileRandomForest(10).train(
        features=trainingAccuracyAman,
        classProperty='class',
        inputProperties=bandsAman
        )

    # Classify rice and others on the composited images
    classifiedBoro = compositeBoro.select(bandsBoro).classify(trainingClassifierBoro)
    classifiedAus = compositeAus.select(bandsAus).classify(trainingClassifierAus)
    classifiedAman = compositeAman.select(bandsAman).classify(trainingClassifierAman)

    #accuracy assessment
    validationBoro = testingAccuracyBoro.classify(trainingClassifierBoro)
    validationAus = testingAccuracyAus.classify(trainingClassifierAus)
    validationAman = testingAccuracyAman.classify(trainingClassifierAman)

    errorMatrixBoro = validationBoro.errorMatrix('class','classification')
    errorMatrixAus = validationAus.errorMatrix('class','classification')
    errorMatrixAman = validationAman.errorMatrix('class','classification')
    # print(type(errorMatrixAman))
    print('Accuracy',errorMatrixAman.accuracy().getInfo())

    classVis = {'min': 0, 'max': 1, 'palette': ['484848','f2c649']}

    # Map.addLayer(classifiedAman.clip(BGD),classVis, 'classified')
    Map.addLayer(classifiedAman.clip(roi), classVis, 'classified')
    # calculate area
    areaImage = ee.Image.pixelArea().addBands(classifiedAman)
    areas = areaImage.reduceRegion(
        reducer=ee.Reducer.sum().group(
            groupField=1,
            groupName='class',
            ),
        # 'geometry': BGD.geometry(),
        geometry=roi.geometry(),
        scale=500,
        maxPixels=1e13,
        tileScale=8
        )

    # Print the area calculations.
    print('##### CLASS AREA SQ. METERS (RF) #####')
    arobj = ee.List(areas.get('groups')).get(1)
    arval =  ee.Number(ee.Dictionary(arobj).get('sum')).divide(1e10)
    # print(arval)

    strArea = ee.String(ee.Number.parse(arval.format('%.2f')))

    # resultString = ee.String('>> Rice Classified Area: ').cat(strArea).cat(ee.String(' mn hectares'))

    # presultsLabel.setValue('Computing, please wait...')
    # resultString.evaluate(function(val){presultsLabel.setValue(val)})
    print('Computing, please wait...')
    # presultsLabel = resultString

    # panel.remove(presultsLabel)
    # panel.add(presultsLabel)
    print('>> Rice Classified Area: ', strArea.getInfo(), ' mn hectares')

    # TODO
    # # export accuracy to Google Drive
    # ee.batch.Export.image.toDrive(
    #     crs='EPSG:4326',
    #     # 'image': classifiedAman.clip(BGD).multiply(100).uint8(),
    #     image=classifiedAman.clip(roi).multiply(100).uint8(),
    #     description="Aman_R1_SA_NE",
    #     scale=10,
    #     # 'region': BGD,
    #     region=roi,
    #     maxPixels=10000000000000
    #     )