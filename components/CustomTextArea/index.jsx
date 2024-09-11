"use client";

import React, { useRef, useCallback } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import registerQuillLanguageTool from "../../components/quill-languagetool";

import { TranslationOutlined } from "@ant-design/icons";

import { Button } from "antd";

registerQuillLanguageTool(Quill);

const modules = {
  toolbar: false,
  languageTool: {
    cooldownTime: 1000,
    language: "auto",
    apiOptions: {
      level: "picky",
    },
  },
};

const CustomTextArea = ({ value, setValue, onKeyDown }) => {
  const quillRef = useRef(null);
  const forceSpellCheck = useCallback(() => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const qlt = quill.getModule("languageTool");

      qlt.checkSpelling();
      qlt.checkSpelling();
    }
  }, []);

  return (
    <>
      <ReactQuill
        ref={quillRef}
        className="custom-text-area"
        theme="snow"
        value={`${value}`}
        onChange={setValue}
        modules={modules}
        onKeyDown={onKeyDown}
      />

      <Button
        className="mt-2"
        size="small"
        type="primary"
        onClick={forceSpellCheck}
        icon={<TranslationOutlined />}
      >
        Spelling checker
      </Button>
    </>
  );
};

export default CustomTextArea;
