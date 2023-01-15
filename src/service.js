import * as XLSX from "xlsx";
import * as _ from 'underscore';

function trimmed(stringData) {
  return ('' + stringData).trim();
}

function parseNumber(numString) {
  return (numString + '').replace(/[^0-9.-]+/g, "")
}


class AppService {
  static outputWorkbook = null;
  static outputJsonData = null;

  static async initProcessing(sourceWorkbook) {
    var clicksWorksheet = sourceWorkbook.Sheets[sourceWorkbook.SheetNames[0]];
    var tenderWorksheet = sourceWorkbook.Sheets[sourceWorkbook.SheetNames[1]];
    var egcmcWorksheet = sourceWorkbook.Sheets[sourceWorkbook.SheetNames[2]];

    let clicksJsonData = XLSX.utils.sheet_to_json(clicksWorksheet);
    let tendersJsonData = XLSX.utils.sheet_to_json(tenderWorksheet);
    let egcmcJsonData = XLSX.utils.sheet_to_json(egcmcWorksheet);

    function initMatchingProcess(accountNo, amount) {
      var isMatched = false;

      _.each(tendersJsonData, (eachData) => {
        let _acct = trimmed(eachData['Document #']);
        let _amount = parseNumber(eachData['Tender Amount']);
        if (accountNo === _acct && amount === -1 * _amount) {
          isMatched = true;
        }
      });

      if (!isMatched) {
        _.each(egcmcJsonData, (eachData) => {
          let _acct = trimmed(eachData['Acct']);
          let _amount = parseNumber(eachData['Amount']);
          if (accountNo === _acct && amount === _amount) {
            isMatched = true;
          }
        });
      }

      return isMatched;
    }

    function initMatchingWorkflow() {
      let foundCount = 0;

      _.each(clicksJsonData, (eachData, index) => {
        let isMatched = false;
        let accountName = trimmed(eachData['Acct']);
        let amountPrice = parseNumber(eachData['Amount']);

        isMatched = initMatchingProcess(accountName, amountPrice);

        if (isMatched) {
          foundCount += 1;
          eachData['Matched'] = trimmed(eachData['Acct']) + trimmed(eachData['Amount']);
        } else {
          eachData['Matched'] = '#N/A';
        }
      })

      console.log(`Matched ${foundCount} out of ${_.values(clicksJsonData).length} entries in this file`);
      AppService.outputJsonData = clicksJsonData;
    }


    initMatchingWorkflow();
  }

  static startProcessing(sourceWorkbook) {
    return new Promise(async (resolve) => {
      setTimeout(function () {
        AppService.initProcessing(sourceWorkbook).then(() => {
          resolve();
        });
      }, 1000);
    });
  }

  static downloadProcessedFile() {
    AppService.outputWorkbook = XLSX.utils.book_new();
    let outputWorksheet = XLSX.utils.json_to_sheet(AppService.outputJsonData);
    XLSX.utils.book_append_sheet(AppService.outputWorkbook, outputWorksheet, "Output");
    XLSX.writeFileXLSX(AppService.outputWorkbook, 'output.xlsx');
  }
}

export default AppService;
