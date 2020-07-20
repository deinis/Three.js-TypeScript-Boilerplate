import XYController from './XYController.js'
import TheBallGame from 'theBallGame.js'

export default class UI {

    public menuActive: boolean
    public recentWinnersTable: HTMLTableElement
    public startButton: HTMLButtonElement
    public menuPanel: HTMLDivElement
    public newGameAlert: HTMLDivElement
    public gameClosedAlert: HTMLDivElement

    public xycontrollerLook: XYController
    public xycontrollerMove: XYController

    private rendererDomElement: HTMLCanvasElement
    private theBallGame: TheBallGame

    private keyMap: { [id: number]: boolean } = {}

    constructor(theBallGame: TheBallGame, rendererDomElement: HTMLCanvasElement) {

        this.theBallGame = theBallGame
        this.rendererDomElement = rendererDomElement
        this.menuActive = true;
        this.recentWinnersTable = document.getElementById('recentWinnersTable') as HTMLTableElement
        this.startButton = document.getElementById('startButton') as HTMLButtonElement
        this.menuPanel = document.getElementById('menuPanel') as HTMLDivElement
        this.newGameAlert = document.getElementById('newGameAlert') as HTMLDivElement
        this.gameClosedAlert = document.getElementById('gameClosedAlert') as HTMLDivElement

        this.startButton.addEventListener('click', () => {
            if (theBallGame.isMobile) {
                this.xycontrollerLook = new XYController(document.getElementById("XYControllerLook") as HTMLCanvasElement, this.onXYControllerLook)
                this.xycontrollerMove = new XYController(document.getElementById("XYControllerMove") as HTMLCanvasElement, this.onXYControllerMove)

                this.menuPanel.style.display = 'none';
                this.recentWinnersTable.style.display = 'block';
                this.menuActive = false

            } else {
                rendererDomElement.requestPointerLock();
            }
        }, false);

        document.addEventListener('pointerlockchange', this.lockChangeAlert, false);


        document.getElementById('screenNameInput').addEventListener('keyup', (e) => {
            if (e.which === 13) blur();
        })

        document.getElementById('screenNameInput').addEventListener("change", (e) => {
            var letterNumber = /^[0-9a-zA-Z]+$/;
            var value = (e.target as HTMLFormElement).value
            if (value.match(letterNumber) && value.length <= 12) {
                theBallGame.socket.emit("updateScreenName", (e.target as HTMLFormElement).value)
            }
            else {
                alert("Alphanumeric screen names only please. Max length 12")
            }
        })
    }

    public updateScoreBoard = (recentWinners: []) => {
        const rows = this.recentWinnersTable.rows;
        var i = rows.length;
        while (--i) {
            this.recentWinnersTable.deleteRow(i);
        }

        recentWinners.forEach((w: any) => {
            const row = this.recentWinnersTable.insertRow()
            const cell0 = row.insertCell(0)
            cell0.appendChild(document.createTextNode(w.screenName))
            const cell1 = row.insertCell(1)
            cell1.appendChild(document.createTextNode(w.time))
        });
    }

    public lockChangeAlert = () => {
        if (document.pointerLockElement === this.rendererDomElement || (document as any).mozPointerLockElement === this.rendererDomElement) {
            this.rendererDomElement.addEventListener('mousemove', this.onDocumentMouseMove, false);
            this.rendererDomElement.addEventListener('mousewheel', this.onDocumentMouseWheel, false);
            document.addEventListener("keydown", this.onDocumentKey, false);
            document.addEventListener("keyup", this.onDocumentKey, false);

            this.menuPanel.style.display = 'none';
            this.recentWinnersTable.style.display = 'block';
            this.menuActive = false
        } else {
            this.rendererDomElement.removeEventListener('mousemove', this.onDocumentMouseMove, false);
            this.rendererDomElement.removeEventListener('mousewheel', this.onDocumentMouseWheel, false);
            document.removeEventListener("keydown", this.onDocumentKey, false);
            document.removeEventListener("keyup", this.onDocumentKey, false);
            this.menuPanel.style.display = 'block';
            this.recentWinnersTable.style.display = 'none';
            this.gameClosedAlert.style.display = 'none';
            this.newGameAlert.style.display = 'none'
            this.menuActive = true
        }
    }

    public onDocumentMouseMove = (e) => {
        this.theBallGame.cameraRotationXZOffset += (e.movementX * this.theBallGame.sensitivity)
        this.theBallGame.cameraRotationYOffset += (e.movementY * this.theBallGame.sensitivity)
        this.theBallGame.cameraRotationYOffset = Math.max(Math.min(this.theBallGame.cameraRotationYOffset, 2.5), -2.5)
        return false;
    }


    public onDocumentMouseWheel = (e) => {
        this.theBallGame.radius -= e.wheelDeltaY * 0.005;
        this.theBallGame.radius = Math.max(Math.min(this.theBallGame.radius, 20), 2);
        return false;
    }


    public onDocumentKey = (e) => {
        this.keyMap[e.keyCode] = e.type == 'keydown';
        const tmpVec = [0, 0]
        if (this.keyMap[87]) { //w
            tmpVec[0] += Math.cos(this.theBallGame.cameraRotationXZOffset)
            tmpVec[1] -= Math.sin(this.theBallGame.cameraRotationXZOffset)
        }
        if (this.keyMap[83]) {//s
            tmpVec[0] -= Math.cos(this.theBallGame.cameraRotationXZOffset)
            tmpVec[1] += Math.sin(this.theBallGame.cameraRotationXZOffset)
        }
        if (this.keyMap[65]) {//a
            tmpVec[0] += Math.sin(this.theBallGame.cameraRotationXZOffset)
            tmpVec[1] += Math.cos(this.theBallGame.cameraRotationXZOffset)
        }
        if (this.keyMap[68]) {//d
            tmpVec[0] -= Math.sin(this.theBallGame.cameraRotationXZOffset)
            tmpVec[1] -= Math.cos(this.theBallGame.cameraRotationXZOffset)
        }
        if (this.keyMap[32]) { //space
            this.theBallGame.spcKey = 1
        } else {
            this.theBallGame.spcKey = 0
        }
        this.theBallGame.vec = [tmpVec[0], tmpVec[1]]
    };


    public onXYControllerLook = (value: vec2) => {
        this.theBallGame.cameraRotationXZOffset -= (value.x) * .1
        this.theBallGame.cameraRotationYOffset += (value.y) * .1
        this.theBallGame.cameraRotationYOffset = Math.max(Math.min(this.theBallGame.cameraRotationYOffset, 2.5), -2.5)
    }

    public onXYControllerMove = (value: vec2) => {
        const tmpVec = [0, 0]
        if (value.y > 0) { //w
            tmpVec[0] += Math.cos(this.theBallGame.cameraRotationXZOffset) * .75
            tmpVec[1] -= Math.sin(this.theBallGame.cameraRotationXZOffset) * .75
        }
        if (value.y < 0) {//s
            tmpVec[0] -= Math.cos(this.theBallGame.cameraRotationXZOffset) * .75
            tmpVec[1] += Math.sin(this.theBallGame.cameraRotationXZOffset) * .75
        }
        if (value.x > 0) {//a
            tmpVec[0] += Math.sin(this.theBallGame.cameraRotationXZOffset) * .75
            tmpVec[1] += Math.cos(this.theBallGame.cameraRotationXZOffset) * .75
        }
        if (value.x < 0) {//d
            tmpVec[0] -= Math.sin(this.theBallGame.cameraRotationXZOffset) * .75
            tmpVec[1] -= Math.cos(this.theBallGame.cameraRotationXZOffset) * .75
        }
        this.theBallGame.vec = [tmpVec[0], tmpVec[1]]
    }


}