function ImageCollection(list) {
    var total = 0;
    var images = {};

    this.append = function (i) {
        var img = new Image();
        images[i.name] = img;
        img.onload = function() {
            total++;
        };
        img.src = i.url;
    };

    for (var i = 0; i < list.length; i++) {
        this.append(list[i]);
    }

    this.get = function(name) {
        return images[name] || (function() { throw "Not exist"; })();
    };

    this.delete = function(name) {
        delete images[name];
    };
}

export var images = new ImageCollection([
    { name: "player", url: "/static/images/screenshot.png"},
    { name: "wall", url: "/static/images/screenshot.png"},
]);
