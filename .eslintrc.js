module.exports = {
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    env: {
        node: true,
    },
    parser: '@typescript-eslint/parser',
    plugins: ['node', '@typescript-eslint'],
    parserOptions: {
        sourceType: 'module',
    },
    rules: {
        semi: 'off',
        '@typescript-eslint/semi': ['error'],

        // クラス定義は見通しの関係上外部公開メソッドを先に記載することもあるため無効にする
        '@typescript-eslint/no-use-before-define': [
            'error',
            { functions: true, classes: false, variables: true },
        ],

        // 明らかに値を持っており、持っていないケースは想定外として process.env.TableName! など意図的に利用するため除外
        '@typescript-eslint/no-non-null-assertion': 'off',

        // prettier と競合しているためeslint側を無効にする
        '@typescript-eslint/indent': 'off',

        // JESTでテストをモック化するときに、主に外部ライブラリを上書きする際にvarが必要
        '@typescript-eslint/no-var-requires': 'off',

        // パラメータとして渡す関数は自明なので明示しなくてよい
        '@typescript-eslint/explicit-function-return-type': [
            'error',
            {
                allowExpressions: true,
                allowTypedFunctionExpressions: true,
                allowHigherOrderFunctions: true,
            },
        ],

        // コンストラクタ隠蔽の為、private constructorの場合は空でも許可する
        '@typescript-eslint/no-empty-function': [
            'error',
            {
                allow: ['private-constructors'],
            }
        ]
    },
};
