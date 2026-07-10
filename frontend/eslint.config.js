import { defineConfig } from "eslint/config";
import reactPlugin from "eslint-plugin-react";
import jestPlugin from "eslint-plugin-jest";
import testingLibraryPlugin from "eslint-plugin-testing-library";
import babelParser from "@babel/eslint-parser";

import pluginSecurity from "eslint-plugin-security";
import securityNode from "eslint-plugin-security-node";
import eslintPluginNoUnsanitized from "eslint-plugin-no-unsanitized";

export default defineConfig([
  {
    files: ["**/*.{js,jsx}"],
    ignores: ["node_modules/**", "dist/**", "build/**", "coverage/**", "reports/**"],

    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-react"],
        },
      },
    },

    plugins: {
      react: reactPlugin,
      security: pluginSecurity,
      "security-node": securityNode,
      "no-unsanitized": eslintPluginNoUnsanitized,
    },

    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...eslintPluginNoUnsanitized.configs.recommended.rules,

      "react/react-in-jsx-scope": "off",

      "security/detect-eval-with-expression": "error",
      "security/detect-non-literal-regexp": "warn",
      "security/detect-unsafe-regex": "warn",
      "security/detect-buffer-noassert": "warn",

      "security-node/detect-crlf": "error",
    },

    settings: {
      react: {
        version: "detect",
      },
    },
  },

  {
    files: ["**/*.test.{js,jsx}"],
    plugins: {
      jest: jestPlugin,
      "testing-library": testingLibraryPlugin,
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
      ...testingLibraryPlugin.configs.react.rules,
      "testing-library/await-async-events": "off",
    },
    languageOptions: {
      globals: {
        test: true,
        expect: true,
        describe: true,
        beforeEach: true,
        afterEach: true,
        it: true,
        jest: true,
      },
    },
  },
]);