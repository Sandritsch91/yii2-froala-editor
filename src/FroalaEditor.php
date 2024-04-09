<?php

namespace sandritsch91\yii2\froala;

use froala\froalaeditor\FroalaEditorWidget;
use yii\base\InvalidConfigException;
use yii\helpers\ArrayHelper;

class FroalaEditor extends FroalaEditorWidget
{
    /**
     * @var array The default options to set via application config.
     */
    public array $defaultClientOptions = [];

    /**
     * {@inheritDoc}
     * @throws InvalidConfigException
     */
    public function init(): void
    {
        parent::init();

        \Yii::$app->i18n->translations['sandritsch91/yii2-froala'] = [
            'class' => 'yii\i18n\GettextMessageSource',
            'sourceLanguage' => 'en-US',
            'basePath' => '@sandritsch91/yii2/froala/messages',
            'forceTranslation' => true
        ];

        $this->clientOptions = ArrayHelper::merge(
            [
                'linkStyles' => [
                    'btn btn-primary' => \Yii::t('sandritsch91/yii2-froala', 'Primary'),
                    'btn btn-secondary' => \Yii::t('sandritsch91/yii2-froala', 'Secondary'),
                    'btn btn-success' => \Yii::t('sandritsch91/yii2-froala', 'Success'),
                    'btn btn-danger' => \Yii::t('sandritsch91/yii2-froala', 'Danger'),
                    'btn btn-warning' => \Yii::t('sandritsch91/yii2-froala', 'Warning'),
                    'btn btn-info' => \Yii::t('sandritsch91/yii2-froala', 'Info'),
                    'btn btn-light' => \Yii::t('sandritsch91/yii2-froala', 'Light'),
                    'btn btn-dark' => \Yii::t('sandritsch91/yii2-froala', 'Dark'),
                ],
                'tableStyles' => [
                    'table-bordered' => \Yii::t('sandritsch91/yii2-froala', 'Bordered'),
                    'table-condensed table-sm' => \Yii::t('sandritsch91/yii2-froala', 'Small'),
                    'table-striped' => \Yii::t('sandritsch91/yii2-froala', 'Striped'),
                ]
            ],
            $this->defaultClientOptions,
            $this->clientOptions
        );
    }

    /**
     * {@inheritDoc}
     */
    public function run(): void
    {
        parent::run();

        FroalaEditorAsset::register($this->view);
    }
}
