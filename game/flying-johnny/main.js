game.module(
    'game.main'
)
.require(
    'game.assets',
    'game.objects',
    'game.scenes'
)
.body(function() {

game.System.startScene = 'SceneGame';
game.System.width = 768;
game.System.height = 1024;

});