import js from '@eslint/js';
import globals from 'globals';
import hooks from 'eslint-plugin-react-hooks';
import refresh from 'eslint-plugin-react-refresh';
export default [{ ignores: ['dist/**','node_modules/**'] },js.configs.recommended,{files:['src/**/*.{js,jsx}'],languageOptions:{ecmaVersion:'latest',sourceType:'module',globals:globals.browser,parserOptions:{ecmaFeatures:{jsx:true}}},plugins:{'react-hooks':hooks,'react-refresh':refresh},rules:{...hooks.configs.recommended.rules,'no-unused-vars':['error',{varsIgnorePattern:'^[A-Z_]',argsIgnorePattern:'^[A-Z_]'}]}},{files:['*.config.js'],languageOptions:{globals:globals.node}}];


