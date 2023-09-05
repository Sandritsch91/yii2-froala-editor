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

        $this->clientOptions = ArrayHelper::merge($this->defaultClientOptions, $this->clientOptions);
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
