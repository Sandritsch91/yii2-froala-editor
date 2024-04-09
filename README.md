yii2-froala-editor
====================================

Extension for froala/yii2-froala-editor


Installation
------------

The preferred way to install this extension is through [composer](http://getcomposer.org/download/).

Either run

```bash
php composer.phar require --prefer-dist sandritsch91/yii2-froala-editor
```

or add 

```json
"sandritsch91/yii2-froala-editor": "*"
```

to the require section of your composer.json

## Default configuration

This widget extends the original FroalaEditor Widget.
This had to be done to be able to configure the FroalaEditor in the Yii2 way. I also added a few default options, you
can overwrite them in the configuration of the application, or in the configuration of the widget.

### Product key

You can set the product key in the (local) configuration of the application:

```php
'container' => [
    'definitions' => [
        'sandritsch91\yii2\froala\FroalaEditor' => [
            'defaultClientOptions' => [
                'key' => 'YOUR_PRODUCT_KEY',
            ]
        ]
    ]
]
```

## Plugins

The original FroalaEditor adds the plugins dynamically, which makes it impossible to configure them in the Yii2 way.
They are all loaded by default, but you can disable them in the configuration of the widget:

```php
<?= FroalaEditor::widget([
    'clientPlugins' => [
        ...
    ],
    'excludedPlugins' => [
        ...
    ],
]); ?>
```
