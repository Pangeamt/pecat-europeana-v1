"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { TranslationOutlined } from "@ant-design/icons";
import { Button } from "antd";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const modules = {
  toolbar: false,
  languageTool: {
    // LanguageTool public endpoint moved to api.languagetool.org
    server: "https://api.languagetool.org",
    cooldownTime: 1000,
    language: "auto",
    apiOptions: {
      level: "picky",
    },
  },
};

const CustomTextArea = ({ value, setValue, onKeyDown }) => {
  const quillRef = useRef(null);
  const [editorReady, setEditorReady] = useState(false);

  useEffect(() => {
    let active = true;

    const setupQuill = async () => {
      const [{ Quill }, registerQuillLanguageToolModule] = await Promise.all([
        import("react-quill-new"),
        import("../../components/quill-languagetool"),
      ]);
      registerQuillLanguageToolModule.default(Quill);

      if (active) setEditorReady(true);
    };

    setupQuill();

    return () => {
      active = false;
    };
  }, []);

  const forceSpellCheck = useCallback(() => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const qlt = quill.getModule("languageTool");
      if (qlt) {
        qlt.checkSpelling();
        qlt.checkSpelling();
      }
    }
  }, []);

  return (
    <>
      {editorReady ? (
        <ReactQuill
          ref={quillRef}
          className="custom-text-area"
          theme="snow"
          value={`${value}`}
          onChange={setValue}
          modules={modules}
          onKeyDown={onKeyDown}
        />
      ) : null}

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
