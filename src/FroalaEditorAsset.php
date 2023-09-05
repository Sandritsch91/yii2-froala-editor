<?php

namespace sandritsch91\yii2\froala;

use yii\web\AssetBundle;

class FroalaEditorAsset extends AssetBundle
{
    public $sourcePath = '@sandritsch91/yii2/froala/assets';
    public $css = [
        'css/froala-theme.css',
    ];
    public $js = [
        'js/froala-link.js'
    ];
    public $publishOptions = [
        'forceCopy' => YII_DEBUG
    ];
}
