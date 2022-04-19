var echarts = require("echarts");
const { createCanvas } = require('canvas')
var fs = require('fs');
var wordCloudLayoutHelper = require('./layout')

/**
 * @param config = {
        width: 500 // Image width, type is number.
        height: 500 // Image height, type is number.
        option: {}, // Echarts configuration, type is Object.
        //If the path  is not set, return the Buffer of image.
        path:  '', // Path is filepath of the image which will be created.
    }

 *
 */
module.exports = function (config) {
    if (config.canvas) {
        Canvas = config.canvas;
    }

    var ctx = createCanvas(128, 128);
    if (config.font) {
        ctx.font = config.font;
    }

    echarts.setCanvasCreator(function () {
        return ctx;
    });

    var chart, option = {
        title: {
            text: 'test'
        },
        tooltip: {},
        legend: {
            data: ['test']
        },
        xAxis: {
            data: ["a", "b", "c", "d", "f", "g"]
        },
        yAxis: {},
        series: [{
            name: 'test',
            type: 'bar',
            data: [5, 20, 36, 10, 10, 20]
        }]
    };

    let defaultConfig = {
      width: 500,
      height: 500,
      option,
      enableAutoDispose: true
    }

    config = Object.assign({}, defaultConfig, config)

    config.option.animation = false;
    chart = echarts.init(createCanvas(parseInt(config.width, 10), parseInt(config.height, 10)));
    chart.setOption(config.option);
    if (config.path) {
        try {
            fs.writeFileSync(config.path, chart.getDom().toBuffer());
            if(config.enableAutoDispose){
              chart.dispose();
            }
            console.log("Create Img:" + config.path)
        } catch (err) {
            console.error("Error: Write File failed" + err.message)
        }

    } else {
        var buffer = chart.getDom().toBuffer();
        try{
          if(config.enableAutoDispose){
            chart.dispose();
          }
        }catch(e){}
        return buffer;
    }
}


// if (!wordCloudLayoutHelper.isSupported) {
//     throw new Error('Sorry your browser not support wordCloud');
// }

// https://github.com/timdream/wordcloud2.js/blob/c236bee60436e048949f9becc4f0f67bd832dc5c/index.js#L233
function updateCanvasMask(maskCanvas) {
    var ctx = maskCanvas.getContext('2d');
    var imageData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    var newImageData = ctx.createImageData(imageData);

    var toneSum = 0;
    var toneCnt = 0;
    for (var i = 0; i < imageData.data.length; i += 4) {
        var alpha = imageData.data[i + 3];
        if (alpha > 128) {
            var tone =
                imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2];
            toneSum += tone;
            ++toneCnt;
        }
    }
    var threshold = toneSum / toneCnt;

    for (var i = 0; i < imageData.data.length; i += 4) {
        var tone =
            imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2];
        var alpha = imageData.data[i + 3];

        if (alpha < 128 || tone > threshold) {
            // Area not to draw
            newImageData.data[i] = 0;
            newImageData.data[i + 1] = 0;
            newImageData.data[i + 2] = 0;
            newImageData.data[i + 3] = 0;
        } else {
            // Area to draw
            // The color must be same with backgroundColor
            newImageData.data[i] = 255;
            newImageData.data[i + 1] = 255;
            newImageData.data[i + 2] = 255;
            newImageData.data[i + 3] = 255;
        }
    }

    ctx.putImageData(newImageData, 0, 0);
}

echarts.registerLayout(function (ecModel, api) {
    ecModel.eachSeriesByType('wordCloud', function (seriesModel) {
        var gridRect = echarts.helper.getLayoutRect(
            seriesModel.getBoxLayoutParams(),
            {
                width: api.getWidth(),
                height: api.getHeight()
            }
        );

        var keepAspect = seriesModel.get('keepAspect');
        var maskImage = seriesModel.get('maskImage');
        var ratio = maskImage ? maskImage.width / maskImage.height : 1;
        keepAspect && adjustRectAspect(gridRect, ratio);

        var data = seriesModel.getData();

        // var canvas = document.createElement('canvas');
        // canvas.width = gridRect.width;
        // canvas.height = gridRect.height;
        var canvas = createCanvas(gridRect.width, gridRect.height);

        var ctx = canvas.getContext('2d');
        if (maskImage) {
            try {
                ctx.drawImage(maskImage, 0, 0, canvas.width, canvas.height);
                updateCanvasMask(canvas);
            } catch (e) {
                console.error('Invalid mask image');
                console.error(e.toString());
            }
        }

        var sizeRange = seriesModel.get('sizeRange');
        var rotationRange = seriesModel.get('rotationRange');
        var valueExtent = data.getDataExtent('value');

        var DEGREE_TO_RAD = Math.PI / 180;
        var gridSize = seriesModel.get('gridSize');
        wordCloudLayoutHelper(canvas, seriesModel,gridRect,{
            list: data
                .mapArray('value', function (value, idx) {
                    var itemModel = data.getItemModel(idx);
                    return [
                        data.getName(idx),
                        itemModel.get('textStyle.fontSize', true) ||
                        echarts.number.linearMap(value, valueExtent, sizeRange),
                        idx
                    ];
                })
                .sort(function (a, b) {
                    // Sort from large to small in case there is no more room for more words
                    return b[1] - a[1];
                }),
            fontFamily:
                seriesModel.get('textStyle.fontFamily') ||
                seriesModel.get('emphasis.textStyle.fontFamily') ||
                ecModel.get('textStyle.fontFamily'),
            fontWeight:
                seriesModel.get('textStyle.fontWeight') ||
                seriesModel.get('emphasis.textStyle.fontWeight') ||
                ecModel.get('textStyle.fontWeight'),

            gridSize: gridSize,

            ellipticity: gridRect.height / gridRect.width,

            minRotation: rotationRange[0] * DEGREE_TO_RAD,
            maxRotation: rotationRange[1] * DEGREE_TO_RAD,

            clearCanvas: !maskImage,

            rotateRatio: 1,

            rotationStep: seriesModel.get('rotationStep') * DEGREE_TO_RAD,

            drawOutOfBound: seriesModel.get('drawOutOfBound'),
            shrinkToFit: seriesModel.get('shrinkToFit'),

            layoutAnimation: seriesModel.get('layoutAnimation'),

            shuffle: false,

            shape: seriesModel.get('shape')
        });

        function onWordCloudDrawn(e) {
            var item = e.detail.item;
            if (e.detail.drawn && seriesModel.layoutInstance.ondraw) {
                e.detail.drawn.gx += gridRect.x / gridSize;
                e.detail.drawn.gy += gridRect.y / gridSize;
                seriesModel.layoutInstance.ondraw(
                    item[0],
                    item[1],
                    item[2],
                    e.detail.drawn
                );
            }
        }

        // canvas.addEventListener('wordclouddrawn', onWordCloudDrawn);

        if (seriesModel.layoutInstance) {
            // Dispose previous
            seriesModel.layoutInstance.dispose();
        }

        seriesModel.layoutInstance = {
            ondraw: null,

            dispose: function () {
                canvas.removeEventListener('wordclouddrawn', onWordCloudDrawn);
                // // Abort
                // canvas.addEventListener('wordclouddrawn', function (e) {
                //     // Prevent default to cancle the event and stop the loop
                //     e.preventDefault();
                // });
            }
        };
    });
});

echarts.registerPreprocessor(function (option) {
    var series = (option || {}).series;
    !echarts.util.isArray(series) && (series = series ? [series] : []);

    var compats = ['shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY'];

    echarts.util.each(series, function (seriesItem) {
        if (seriesItem && seriesItem.type === 'wordCloud') {
            var textStyle = seriesItem.textStyle || {};

            compatTextStyle(textStyle.normal);
            compatTextStyle(textStyle.emphasis);
        }
    });

    function compatTextStyle(textStyle) {
        textStyle &&
        echarts.util.each(compats, function (key) {
            if (textStyle.hasOwnProperty(key)) {
                textStyle['text' + echarts.format.capitalFirst(key)] = textStyle[key];
            }
        });
    }
});

function adjustRectAspect(gridRect, aspect) {
    // var outerWidth = gridRect.width + gridRect.x * 2;
    // var outerHeight = gridRect.height + gridRect.y * 2;
    var width = gridRect.width;
    var height = gridRect.height;
    if (width > height * aspect) {
        gridRect.x += (width - height * aspect) / 2;
        gridRect.width = height * aspect;
    } else {
        gridRect.y += (height - width / aspect) / 2;
        gridRect.height = width / aspect;
    }
}


echarts.extendSeriesModel({
    type: 'series.wordCloud',

    visualStyleAccessPath: 'textStyle',
    visualStyleMapper: function (model) {
        return {
            fill: model.get('color')
        };
    },
    visualDrawType: 'fill',

    optionUpdated: function () {
        var option = this.option;
        option.gridSize = Math.max(Math.floor(option.gridSize), 4);
    },

    getInitialData: function (option, ecModel) {
        var dimensions = echarts.helper.createDimensions(option.data, {
            coordDimensions: ['value']
        });
        var list = new echarts.List(dimensions, this);
        list.initData(option.data);
        return list;
    },

    // Most of options are from https://github.com/timdream/wordcloud2.js/blob/gh-pages/API.md
    defaultOption: {
        maskImage: null,

        // Shape can be 'circle', 'cardioid', 'diamond', 'triangle-forward', 'triangle', 'pentagon', 'star'
        shape: 'circle',
        keepAspect: false,

        left: 'center',

        top: 'center',

        width: '70%',

        height: '80%',

        sizeRange: [12, 60],

        rotationRange: [-90, 90],

        rotationStep: 45,

        gridSize: 8,

        drawOutOfBound: false,
        shrinkToFit: false,

        textStyle: {
            fontWeight: 'normal'
        }
    }
});

echarts.extendChartView({
    type: 'wordCloud',

    render: function (seriesModel, ecModel, api) {
        var group = this.group;
        group.removeAll();

        var data = seriesModel.getData();

        var gridSize = seriesModel.get('gridSize');

        seriesModel.layoutInstance.ondraw = function (text, size, dataIdx, drawn) {
            var itemModel = data.getItemModel(dataIdx);
            var textStyleModel = itemModel.getModel('textStyle');

            var textEl = new echarts.graphic.Text({
                style: echarts.helper.createTextStyle(textStyleModel),
                scaleX: 1 / drawn.info.mu,
                scaleY: 1 / drawn.info.mu,
                x: (drawn.gx + drawn.info.gw / 2) * gridSize,
                y: (drawn.gy + drawn.info.gh / 2) * gridSize,
                rotation: drawn.rot
            });
            textEl.setStyle({
                x: drawn.info.fillTextOffsetX,
                y: drawn.info.fillTextOffsetY + size * 0.5,
                text: text,
                verticalAlign: 'middle',
                fill: data.getItemVisual(dataIdx, 'style').fill,
                fontSize: size
            });

            group.add(textEl);

            data.setItemGraphicEl(dataIdx, textEl);

            textEl.ensureState('emphasis').style = echarts.helper.createTextStyle(
                itemModel.getModel(['emphasis', 'textStyle']),
                {
                    state: 'emphasis'
                }
            );
            textEl.ensureState('blur').style = echarts.helper.createTextStyle(
                itemModel.getModel(['blur', 'textStyle']),
                {
                    state: 'blur'
                }
            );

            echarts.helper.enableHoverEmphasis(
                textEl,
                itemModel.get(['emphasis', 'focus']),
                itemModel.get(['emphasis', 'blurScope'])
            );

            textEl.stateTransition = {
                duration: seriesModel.get('animation')
                    ? seriesModel.get(['stateAnimation', 'duration'])
                    : 0,
                easing: seriesModel.get(['stateAnimation', 'easing'])
            };
            // TODO
            textEl.__highDownDispatcher = true;
        };

        this._model = seriesModel;
    },

    remove: function () {
        this.group.removeAll();

        this._model.layoutInstance.dispose();
    },

    dispose: function () {
        this._model.layoutInstance.dispose();
    }
});
