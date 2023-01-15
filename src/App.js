import React, { useState } from 'react';
import { App, Button, Upload } from 'antd';
import { PlusOutlined, FileExcelOutlined, DownloadOutlined } from '@ant-design/icons';
import AppService from './service.js';
import * as XLSX from "xlsx";

const MyPage = () => {
  const [processing, setIsProcessing] = useState(false);
  const [finished, setFinished] = useState(false);
  const [workbook, setWorkbook] = useState();
  const [file, setFile] = useState();

  const handleChange = async (info) => {
    setFile(info.file);

    const fileReader = await new FileReader()
    fileReader.readAsArrayBuffer(info.file.originFileObj)
    fileReader.onload = (e) => {
      const bufferArray = e?.target.result
      const workbook = XLSX.read(bufferArray, { type: "buffer" })
      setWorkbook(workbook)
    }
  };

  const processDocument = () => {
    setIsProcessing(true);
    AppService.startProcessing(workbook)
      .then(() => {
        setIsProcessing(false);
        setFinished(true);
      });
  }

  const downloadOutputDocument = () => {
    AppService.downloadProcessedFile();
  }


  return (
    <div style={{
      display: 'flex',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div>
        <div style={{ fontSize: 25, fontWeight: 'bold' }}>
          Automator
        </div>
        <ExcelUploadButton handleChange={handleChange} file={file} />

        {
          finished ?
            <div style={{ paddingBottom: 10, paddingTop: 20 }}>
              <Button type="primary" onClick={downloadOutputDocument} icon={<DownloadOutlined />} size={30}>
                Download
              </Button>
            </div> : null
        }

        <ProcessButton
          file={file}
          finished={finished}
          processing={processing}
          processDocument={processDocument}
        />

      </div>
    </div>
  );
};

const MyApp = () => (
  <App>
    <MyPage />
  </App>
);

export default MyApp;

const ProcessButton = ({ file, finished, processing, processDocument }) => {
  if (finished) {
    return <div />
  }

  return <div style={{ paddingBottom: 10, paddingTop: 15 }}>
    <Button type="primary"
      disabled={!file}
      loading={processing}
      onClick={processDocument}>
      Process
    </Button>
  </div>;
}






const ExcelUploadButton = ({ handleChange, file }) => {

  const uploadButtonUI = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8, }}>
        Upload
      </div>
    </div>
  )

  const UploadedFileInfo = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <FileExcelOutlined style={{ fontSize: 50 }} />
        {file.name}
      </div>
    )
  }

  return (
    <div style={{ minWidth: 200 }}>
      <div style={{ fontSize: 18, paddingBottom: 10, paddingTop: 20 }}>
        Upload Source Excel File
      </div>
      <Upload
        name="avatar"
        listType="picture-card"
        className="avatar-uploader"
        maxCount={1}
        showUploadList={false}
        onChange={handleChange}
        customRequest={() => { }}
      >
        <div >
          {file ? <UploadedFileInfo /> : uploadButtonUI}
        </div>
      </Upload>
    </div>
  );
}