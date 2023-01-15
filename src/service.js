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
        // eslint-disable-next-line eqeqeq
        if (accountNo == _acct && amount == -1 * _amount) {
          isMatched = true;
        }
      });

      if (!isMatched) {
        _.each(egcmcJsonData, (eachData) => {
          let _acct = trimmed(eachData['Acct']);
          let _amount = parseNumber(eachData['Amount']);
          // eslint-disable-next-line eqeqeq
          if (accountNo == _acct && amount == _amount) {
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
          eachData['Comments'] = 'Matched with SA';

        } else {
          eachData['Matched'] = '#N/A';
          // eslint-disable-next-line eqeqeq
          if (eachData['TranType'] == "BALANCETRANSFER") {
            eachData['Comments'] = 'Balance Transfer';
          }
          // eslint-disable-next-line eqeqeq
          else if (parseNumber(eachData['Store']) == 799) {
            eachData['Comments'] = 'Bulk Activation';
            // eslint-disable-next-line eqeqeq
          } else if (parseNumber(eachData['Amount']) == 0) {
            eachData['Comments'] = 'Zero Out';
          }
        }
      })

      console.log(`Matched ${foundCount} out of ${_.values(clicksJsonData).length} entries in this file`);
      AppService.outputJsonData = clicksJsonData;
    }

    function initVoidOffsetWorkflow() {
      _.each(clicksJsonData, (eachData, index) => {
        let tranType = trimmed(eachData['TranType']);

        if (tranType.includes('VOID')) {
          let accountNo = eachData['Acct'];
          let tranDate = trimmed(eachData['TranDate']);
          let amount = parseNumber(eachData['Amount']);

          _.each(clicksJsonData, (subEachData, index) => {
            let _accountNo = subEachData['Acct'];
            let _tranDate = trimmed(subEachData['TranDate']);
            let _amount = parseNumber(subEachData['Amount']);

            // eslint-disable-next-line eqeqeq
            if (accountNo == _accountNo && tranDate && _tranDate && _amount == (-1 * amount)) {
              subEachData['Comments'] = "Offset";
              eachData['Comments'] = "Offset";
            }
          });
        }
      });
    }

    initMatchingWorkflow();
    initVoidOffsetWorkflow();
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
