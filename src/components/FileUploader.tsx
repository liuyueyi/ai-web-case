import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploaderProps {
  onConfigLoad: (config: {
    numColorMap: Record<string, string>;
    borderColorMap: Record<string, string>;
    matrix: (number | string)[][];
  }) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onConfigLoad }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonContent = JSON.parse(event.target?.result as string);
          const { numColorMap, borderColorMap, matrix } = jsonContent;
          
          if (!numColorMap || !borderColorMap || !matrix) {
            throw new Error('配置文件格式不正确，请确保包含 numColorMap、borderColorMap 和 matrix 字段');
          }
          
          onConfigLoad({
            numColorMap,
            borderColorMap,
            matrix
          });
        } catch (error) {
          alert(error instanceof Error ? error.message : '文件解析失败');
        }
      };
      reader.readAsText(file);
    }
  }, [onConfigLoad]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json']
    },
    multiple: false
  });

  return (
    <div
      {...getRootProps()}
      style={{
        border: '2px dashed #cccccc',
        borderRadius: '4px',
        padding: '20px',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: isDragActive ? '#f0f0f0' : '#ffffff',
        marginBottom: '20px'
      }}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>拖放文件到这里...</p>
      ) : (
        <p>拖放JSON配置文件到这里，或点击选择文件</p>
      )}
    </div>
  );
};

export default FileUploader;