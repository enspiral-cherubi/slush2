const THREE = require('three')
const $ = require('jquery')
const OrbitControls = require('three-orbit-controls')(THREE)
const FlyControls = require('three-fly-controls')(THREE)
const WindowResize = require('three-window-resize')
const dat = require('dat.gui')
const webAudioAnalyser2 = require('web-audio-analyser-2')
const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
const getMic = require('./getMic.js')(audioCtx)

class Environment {

  constructor () {
    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000)
    this.camera.position.z = 10
    this.camera.position.x = 0
    this.camera.position.y = 0


    this.renderer = new THREE.WebGLRenderer({alpha: true, canvas: $('#three-canvas')[0]})
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setClearColor(0x000000, 1)

    // this.controls = new OrbitControls(this.camera)
    this.controls = new THREE.FlyControls(this.camera, this.renderer.domElement)
    this.controls.movementSpeed = 0.1
    this.controls.rollSpeed = 0.01
    this.keyMap = {}

    const windowResize = new WindowResize(this.renderer, this.camera)

    this.gui = new dat.GUI()
    var options = this.gui.addFolder('options')
    this.rotate = true
    this.gate = 100
    options.add(this, 'rotate').listen()
    options.add(this, 'gate').min(0).max(250).step(1).listen()
    options.open()

    this._addCubeToScene()

    this.analyser = webAudioAnalyser2({
      context: audioCtx,
      fftSize: 2048,
      equalTemperedFreqBinCount: 3
    })

    // this causes output
    // this.analyser.connect(audioCtx.destination)

    var self = this

    getMic(audioCtx)
  .then(function (microphone) {
    microphone.connect(self.analyser)
  })
  .fail(function (err) {
    console.log('err: ', err)
  })

  }

  render () {

    if(this.rotate){
      this.cube.rotation.x+= this.applyGate(this.analyser.barkScaleFrequencyData().frequencies[0])/1000
      this.cube.rotation.y+=this.applyGate(this.analyser.barkScaleFrequencyData().frequencies[1])/1000
      this.cube.rotation.z+=this.applyGate(this.analyser.barkScaleFrequencyData().frequencies[2])/1000

    }


    this.renderer.render(this.scene, this.camera)

  }

  // 'private'

  applyGate(v) {
    if (v < this.gate){
      return 0
    }
    else {
      return v
    }

  }

  _addCubeToScene() {
    var geometry = new THREE.BoxGeometry(1,1,1)
    var material = new THREE.MeshNormalMaterial()
    this.cube = new THREE.Mesh(geometry,material)
    this.scene.add(this.cube)
  }



}

module.exports = Environment
