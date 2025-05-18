// MultiBgs.js
// Version: 1.1

/*:
* @plugindesc Allows you to play multiple Background Sounds at the same time
* @author Arthran
* 
* @help
* 
* By default, RPG Maker only allows you to play one BGS at a time. This plugin
* will allow you to play multiple BGS at the same time, through plugin commands.
* 
* ============================================================================
* Plugin Commands
* ============================================================================
*
* Plugin Command:
*   MBGS play Name volume pitch pan  - Plays the specified BGS at the specified
*                                      volume, pitch, and pan. The latter three
*                                      arguements are optional. If omitted, they
*                                      will default to 90, 100, and 0
*                                      respectively. The Name arguement is 
*                                      required, and it needs to be the filename
*                                      of the BGS, without the extension. Does
*                                      not support filenames that have spaces.
*                                      If you need spaces in your filename,
*                                      see the script call below.
*
*   MBGS stop                       - Stops all BGS
*
* Examples:
*   MBGS play River 25 100 0  - Plays River.ogg at 25% volume, 100% pitch, 0 pan
*   MBGS play River 25        - Does the same thing
*   MBGS play Drips           - Plays Drips.m4a at 90% volume, 100% pitch, 0 pan
*
* ============================================================================
* Script Calls
* ============================================================================
*
* If your filename has a space in it, the plugin command will be unable to play
* it. In that case, you can use the following script call instead:
* 
* Script Call:
*   MBGS.play("Name", volume, pitch, pan);  - Plays the specified BGS at the
*                                             specified parameters. Volume,
*                                             pitch, and pan are optional.
*
*   MBGS.stop();                            - Works the same as the plugin
*                                             command.
*
* Examples:
*   MBGS.play("My BGS", 25, 100, 0);  - Plays 'My BGS.ogg' at 25% volume,
*                                       100% pitch, 0 pan
*   MBGS.play("My BGS", 25);          - Does the same thing
*
* ============================================================================
* Notes
* ============================================================================
*
* The "Play BGS..." event command still has the default behavior. That is to
* say that it still only allows you to play one BGS at a time. You will need
* to use the plugin command or script call in order to play multiple.
*
* Feel free to use this plugin in any kind of project you want. Please include
* Arthran in the credits of your game. You may edit this however you want, but 
* please do leave my name somewhere in the annotations.
*/

var MBGS = {};

MBGS.play = function(aname, avolume = 90, apitch = 100, apan = 0) {
    AudioManager.playBgsEx({
        name: aname,
        volume: avolume,
        pitch: apitch,
        pan: apan
    });
};

MBGS.stop = function() {
    AudioManager.stopBgs();
};

(function() {

    const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'MBGS') {
            switch (args[0]) {
            case 'play':
                AudioManager.playBgsEx({
                    name: args[1],
                    volume: Number(args[2] || 90),
                    pitch: Number(args[3] || 100),
                    pan: Number(args[4] || 0)
                });
                break;
            case 'stop':
                AudioManager.stopBgs();
                break;
            }
        }
    };


    AudioManager._bgsBuffers = [];
    AudioManager._currentBgsEx = [];

    AudioManager.playBgsEx = function(bgs, pos) {
        let isCurrentBgs = this.isCurrentBgsEx(bgs);

        if (isCurrentBgs >= 0) {
            this.updateBgsParametersEx(this._bgsBuffers[isCurrentBgs], bgs);
        } else if (bgs.name) {
            var buffer = this.createBuffer('bgs', bgs.name);
            this.updateBgsParametersEx(buffer, bgs);
            buffer.play(true, pos || 0);
            this._bgsBuffers.push(buffer);
            this._currentBgsEx.push(bgs);
        }
    };

    AudioManager.isCurrentBgsEx = function(bgs) {
        if ((this._currentBgsEx.length > 0) && (this._bgsBuffers.length > 0)) {
            let result = this._currentBgsEx.findIndex(function(currentBgs) {
                return (currentBgs.name == bgs.name);
            });
            return result;
        } else {
            return -1;
        }
    };

    AudioManager.updateBgsParametersEx = function(buffer, bgs) {
        this.updateBufferParameters(buffer, this._bgsVolume, bgs);
    };

    const _AudioManager_stopBgs = AudioManager.stopBgs;
    AudioManager.stopBgs = function() {
        _AudioManager_stopBgs.call(this);

        if (this._bgsBuffers.length > 0) {
            this.stopBgsEx();
        }
    };

    AudioManager.stopBgsEx = function() {
        this._bgsBuffers.forEach(function(buffer) {
            buffer.stop();
        });
        this._bgsBuffers = [];
        this._currentBgsEx = [];
    };

    AudioManager.saveBgsEx = function() {
        const bgsEx = [];
        for (const bgs of this._currentBgsEx) {
            bgsEx.push({
                name: bgs.name,
                volume: bgs.volume,
                pitch: bgs.pitch,
                pan: bgs.pan
            });
        }
        return bgsEx;
    };

    const _Game_System_onBeforeSave = Game_System.prototype.onBeforeSave;
    Game_System.prototype.onBeforeSave = function() {
        _Game_System_onBeforeSave.call(this);
        this._bgsExOnSave = AudioManager.saveBgsEx();
    };

    const _Game_System_onAfterLoad = Game_System.prototype.onAfterLoad;
    Game_System.prototype.onAfterLoad = function() {
        _Game_System_onAfterLoad.call(this);

        for (const bgs of this._bgsExOnSave) {
            AudioManager.playBgsEx(bgs);
        }
    };
})();