
# node-echarts-canvas
Echarts server side render by node canvas, generate chart image by Echarts.
使用NodeJs服务器端渲染echarts图表，生成图片格式。

forked from https://github.com/hellosean1025/node-echarts , 2 changes:
1. update echarts version
2. change canvas-prebuilt to canvas, canvas-prebuilt was officially deprecated

### Install
OS | Command
----- | -----
OS X | `brew install pkg-config cairo pango libpng jpeg giflib`
Ubuntu | `sudo apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++`
Fedora | `sudo yum install cairo cairo-devel cairomm-devel libjpeg-turbo-devel pango pango-devel pangomm pangomm-devel giflib-devel`
Solaris | `pkgin install cairo pango pkg-config xproto renderproto kbproto xextproto`
Windows | [Instructions on our wiki](https://github.com/Automattic/node-canvas/wiki/Installation---Windows)

```
npm install node-echarts-canvas
```

### Usage
```javascript
var echarts = require('node-echarts-canvas');
var config = {
    width: 500, // Image width, type is number.
    height: 500, // Image height, type is number.
    option: {}, // Echarts configuration, type is Object.
    //If the path  is not set, return the Buffer of image.
    path:  '', // Path is filepath of the image which will be created.
    enableAutoDispose: true  //Enable auto-dispose echarts after the image is created.
}

echarts(config)

```

### Config

|name|type|default|description|
|---|---|---|---|
|width|Number|500|Image width|
|height|Number|500|Image height|
|option|Object|{}|Echarts Options|
|path|String|-|Path is filepath of the image which will be created. If the path is empty, return buffer.|
|enableAutoDispose|Boolean|true|Enable auto-dispose echarts after the image is created.|