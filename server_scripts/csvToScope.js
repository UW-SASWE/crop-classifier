const fs = require("fs");
const { parse } = require("csv-parse");

const csvToScopeJSON = (
  csvInput,
  records = [],
  scopeJSON = {
    countries: [],
    divisions: [],
    zilas: [],
    upazilas: [],
    unions: [],
  }
) =>
  new Promise((resolve, reject) => {
    parse(csvInput, {
      trim: true,
      columns: true,
      skip_empty_lines: true,
    })
      .on("readable", function () {
        let record;
        while ((record = this.read()) !== null) {
          records.push(record);
        }
      })
      .on("end", () => {
        for (let i = 0, len = records.length; i < len; i++) {
          var scopeData = records[i];
          //   console.log(scopeData);
          if (!scopeJSON.divisions.includes(scopeData.division)) {
            scopeJSON.divisions.push(scopeData.division);
          }
          if (!scopeJSON.zilas.includes(scopeData.zila)) {
            scopeJSON.zilas.push(scopeData.zila);
          }
          if (!scopeJSON.upazilas.includes(scopeData.upazila)) {
            scopeJSON.upazilas.push(scopeData.upazila);
          }
          if (!scopeJSON.unions.includes(scopeData.union)) {
            scopeJSON.unions.push(scopeData.union);
          }

          // create divisions nested object
          if (!scopeJSON.countries.includes(scopeData.country)) {
            scopeJSON.countries.push(scopeData.country);
            scopeJSON[scopeData.country] = {
              pcode: scopeData.country_code,
              divisions: [],
            };
          }

          if (
            !scopeJSON[scopeData.country].divisions.includes(scopeData.division)
          ) {
            scopeJSON[scopeData.country].divisions.push(scopeData.division);
            scopeJSON[scopeData.country][scopeData.division] = {
              pcode: scopeData.division_code,
              zilas: [],
            };
          }

          //   divisions
          if (
            !scopeJSON[scopeData.country][scopeData.division].zilas.includes(
              scopeData.zila
            )
          ) {
            scopeJSON[scopeData.country][scopeData.division].zilas.push(
              scopeData.zila
            );
            scopeJSON[scopeData.country][scopeData.division][scopeData.zila] = {
              pcode: scopeData.zila_code,
              upazilas: [],
            };
          }

          if (
            !scopeJSON[scopeData.country][scopeData.division][
              scopeData.zila
            ].upazilas.includes(scopeData.upazila)
          ) {
            scopeJSON[scopeData.country][scopeData.division][
              scopeData.zila
            ].upazilas.push(scopeData.upazila);
            scopeJSON[scopeData.country][scopeData.division][scopeData.zila][
              scopeData.upazila
            ] = {
              pcode: scopeData.upazila_code,
              unions: [],
            };
          }

          if (
            !scopeJSON[scopeData.country][scopeData.division][scopeData.zila][
              scopeData.upazila
            ].unions.includes(scopeData.union)
          ) {
            scopeJSON[scopeData.country][scopeData.division][scopeData.zila][
              scopeData.upazila
            ].unions.push(scopeData.union);
            scopeJSON[scopeData.country][scopeData.division][scopeData.zila][
              scopeData.upazila
            ][scopeData.union]={pcode: scopeData.union_code,};
          }
        }
        resolve(scopeJSON);
      });
  });

// // example usage of the csvToscopeJSON function
// var a = `
// country,division,zila,upazila,union
// Bangladesh,Barisal,Barisal,Agailjhara,Bagdha
// Bangladesh,Barisal,Barisal,Agailjhara,Bakal
// Bangladesh,Barisal,Barisal,Agailjhara,Gaila
// Bangladesh,Barisal,Barisal,Agailjhara,Rajiher
// Bangladesh,Barisal,Barisal,Agailjhara,Ratnapur
// Bangladesh,Barisal,Barguna,Amtali,Amtali
// Bangladesh,Barisal,Barguna,Amtali,Arpangashia
// Bangladesh,Barisal,Barguna,Amtali,Atharagashia
// Bangladesh,Barisal,Barguna,Amtali,Barabagi
// Bangladesh,Barisal,Barguna,Amtali,Chhota Bagi
// Bangladesh,Barisal,Barguna,Amtali,Chowra
// Bangladesh,Barisal,Barguna,Amtali,Gulisakhali
// Bangladesh,Barisal,Barguna,Amtali,Haldia
// Bangladesh,Barisal,Barguna,Amtali,Karaibaria
// Bangladesh,Barisal,Barguna,Amtali,Kukua
// `;

// (async function () {
//   try {
//     var scopeJSON = await csvToScopeJSON(a);
//     // console.log(scopeJSON);
//     fs.writeFile("./sandbox.json", JSON.stringify(scopeJSON), (err) => {
//       if (err) {
//         console.log("The file was not saved: ", err);
//       }
//       console.log("The file has been saved!");
//     });
//   } catch {
//     ("Diddn't work");
//   }
// })();

// // Example of loading and converting a csv scope file
// const fs = require("fs");
// const csvToScope = require("./server_scripts/csvToScope");

// // read json files with a promise
// const readFile = (path, opts = {}) =>
//   new Promise((resolve, reject) => {
//     fs.readFile(path, opts, (err, data) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(data);
//       }
//     });
//   });

// (async function () {
//   try {
//     var scopeCsv = await readFile("./cc_assets/bangladesh_scope.csv");
//     var scopeJSON = await csvToScope(scopeCsv);
//     fs.writeFile(
//       "./cc_assets/bg_scopes.json",
//       JSON.stringify(scopeJSON),
//       (err) => {
//         if (err) {
//           console.log("The file was not saved: ", err);
//         }
//         console.log("The file has been saved!");
//       }
//     );
//   } catch {
//     ("Could not convert scopes csv to json");
//   }
// })();

module.exports = csvToScopeJSON;
