/**    
    @module loader
    @namespace game
**/
game.module(
    'engine.loader'
)
.body(function(){ 'use strict';

/**
    Dynamic loader for assets and audio.
    @class Loader
    @extends game.Class
**/
game.Loader = game.Class.extend({
    /**
        Scene to start, when loader is finished.
        @property {game.Scene} scene
    **/
    scene: null,
    /**
        Number of files loaded.
        @property {Number} loaded
    **/
    loaded: 0,
    /**
        Percent of files loaded.
        @property {Number} percent
    **/
    percent: 0,
    /**
        Background color of preloader.
        @property {Number} backgroundColor
        @default 0x984eb4
    **/
    backgroundColor: 0x984eb4,
    /**
        List of assets to load.
        @property {Array} assets
    **/
    assets: [],
    /**
        List of sounds to load.
        @property {Array} assets
    **/
    sounds: [],
    
    init: function(scene) {
        var i;

        this.scene = scene || SceneGame;
        this.stage = game.system.stage;

        for (i = 0; i < game.resources.length; i++) {
            if(game.TextureCache[game.resources[i]]) continue;
            this.assets.push(game.Loader.getPath(game.resources[i]));
        }

        for(var name in game.Audio.queue) {
            this.sounds.push(name);
        }

        if(this.assets.length > 0) {
            this.loader = new game.AssetLoader(this.assets, true);
            this.loader.onProgress = this.progress.bind(this);
            this.loader.onComplete = this.loadAudio.bind(this);
            this.loader.onError = this.error.bind(this);
        }

        if(this.assets.length === 0 && this.sounds.length === 0) this.percent = 100;
    },

    initStage: function() {
        this.symbol = new game.Sprite(game.Texture.fromImage(game.Loader.logo));
        this.symbol.anchor.set(0.5, 1.0);
        this.symbol.position.set(game.system.width / 2, game.system.height / 2 + this.symbol.height / 2);
        this.stage.addChild(this.symbol);

        var barBg = new game.Graphics();
        barBg.beginFill(game.Loader.barBg);
        barBg.drawRect(0, 0, 200, 20);
        barBg.position.set(game.system.width / 2 - 100, game.system.height / 2 + this.symbol.height / 2 + 20);
        this.stage.addChild(barBg);

        this.bar = new game.Graphics();
        this.bar.beginFill(game.Loader.barColor);
        this.bar.drawRect(0, 0, 200, 20);
        this.bar.position.set(game.system.width / 2 - 100, game.system.height / 2 + this.symbol.height / 2 + 20);
        this.bar.scale.x = this.percent / 100;
        this.stage.addChild(this.bar);

        if(game.Tween && game.Loader.logoTween) {
            this.symbol.rotation = -0.1;

            var tween = new game.Tween(this.symbol)
                .to({rotation: 0.1}, 500)
                .easing(game.Tween.Easing.Cubic.InOut)
                .repeat()
                .yoyo();
            tween.start();
        }
    },

    /**
        Start loader.
        @method start
    **/
    start: function() {
        if(game.scene) {
            for (var i = this.stage.children.length - 1; i >= 0; i--) {
                this.stage.removeChild(this.stage.children[i]);
            }
            this.stage.setBackgroundColor(this.backgroundColor);

            this.stage.interactive = false; // this is not working, bug?

            this.stage.mousemove = this.stage.touchmove = null;
            this.stage.click = this.stage.tap = null;
            this.stage.mousedown = this.stage.touchstart = null;
            this.stage.mouseup = this.stage.mouseupoutside = this.stage.touchend = this.stage.touchendoutside = null;
            this.stage.mouseout = null;
        }
        if(game.audio) game.audio.stopAll();

        if(typeof(this.backgroundColor) === 'number') {
            var bg = new game.Graphics();
            bg.beginFill(this.backgroundColor);
            bg.drawRect(0, 0, game.system.width, game.system.height);
            this.stage.addChild(bg);
        }
        
        this.initStage();

        if(this.assets.length > 0) this.loader.load();
        else this.loadAudio();
        
        if(!game.scene) this.loopId = game.setGameLoop(this.run.bind(this), game.system.canvas);
        else game.scene = this;
    },

    /**
        Error loading file.
        @method error
        @param {String} msg
    **/
    error: function(msg) {
        if(msg) throw msg;
    },

    /**
        File loaded.
        @method progress
    **/
    progress: function(loader) {
        if(loader && loader.json && !loader.json.frames && !loader.json.bones) game.json[loader.url] = loader.json;
        this.loaded++;
        this.percent = Math.round(this.loaded / (this.assets.length + this.sounds.length) * 100);
        this.onPercentChange();
    },

    /**
        Called when percent is changed.
        @method onPercentChange
    **/
    onPercentChange: function() {
        if(this.bar) this.bar.scale.x = this.percent / 100;
    },

    /**
        Start loading audio.
        @method loadAudio
    **/
    loadAudio: function() {
        for (var i = this.sounds.length - 1; i >= 0; i--) {
            game.audio.load(this.sounds[i], this.progress.bind(this));
        }
    },

    /**
        All files loaded.
        @method ready
    **/
    ready: function() {
        this.setScene();
    },

    /**
        Set scene.
        @method setScene
    **/
    setScene: function() {
        if(game.system.retina || game.system.hires) {
            for(var i in game.TextureCache) {
                if(i.indexOf('@2x') !== -1) {
                    game.TextureCache[i.replace('@2x', '')] = game.TextureCache[i];
                    delete game.TextureCache[i];
                }
            }
        }
        game.resources.length = 0;
        game.Audio.resources = {};
        game.Timer.time = Number.MIN_VALUE;
        game.clearGameLoop(this.loopId);
        game.system.setScene(this.scene);
    },

    run: function() {
        this.last = game.Timer.time;
        game.Timer.update();
        game.system.delta = (game.Timer.time - this.last) / 1000;

        this.update();
        this.render();
    },

    update: function() {
        if(!this.startTime) this.startTime = Date.now();
        if(game.tweenEngine) game.tweenEngine.update();

        if(this._ready) return;
        if(this.timer) {
            if(this.timer.time() >= 0) {
                this._ready = true;
                this.ready();
            }
        } else if(this.loaded === this.assets.length + this.sounds.length) {
            // Everything loaded
            var loadTime = Date.now() - this.startTime;
            var waitTime = Math.max(100, game.Loader.timeout - loadTime);
            this.timer = new game.Timer(waitTime);
        }
    },

    render: function() {
        game.system.renderer.render(this.stage);
    }
});

/**
    Used to load correct file when in Retina/HiRes mode.
    @attribute {Function} getPath
    @param {String} path
**/
game.Loader.getPath = function(path) {
    return game.system.retina || game.system.hires ? path.replace(/\.(?=[^.]*$)/, '@2x.') : path;
};

/**
    Minimum time to show preloader, in milliseconds.
    @attribute {Number} timeout
    @default 500
**/
game.Loader.timeout = 500;

/**
    Background color of the loading bar.
    @attribute {Number} barBg
    @default 0x3a6532
**/
game.Loader.barBg = 0xffffff;

/**
    Color of the loading bar.
    @attribute {Number} barColor
    @default 0xe6e7e8
**/
game.Loader.barColor = 0x4e135e;

/**
    Use tween on loader logo.
    @attribute {Boolean} tween
    @default true
**/
game.Loader.logoTween = true;

game.Loader.logo = 'media/face.png';

});