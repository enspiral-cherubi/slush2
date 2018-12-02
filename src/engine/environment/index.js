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
    this.controls.movementSpeed = 0.5
    this.controls.rollSpeed = 0.01
    this.keyMap = {}

    const windowResize = new WindowResize(this.renderer, this.camera)

    this.gui = new dat.GUI()
    var options = this.gui.addFolder('options')
    this.rotate = true
    this.gate = 100
    this.spring = 0
    this.drag = 5
    options.add(this, 'rotate').listen()
    options.add(this, 'spring').min(0).max(1).step(0.01).listen()
    options.add(this, 'drag').min(0).max(10).step(1).listen()
    options.add(this, 'gate').min(0).max(250).step(1).listen()
    options.open()

    // this._addCubeToScene()

    this.numFreqBins = 4
    this.analyser = webAudioAnalyser2({
      context: audioCtx,
      fftSize: 2048,
      equalTemperedFreqBinCount: this.numFreqBins
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

  this.gridSize = 100
  this.createFibers(this.gridSize,this.gridSize)


  this.profiles = []
  for(var k = 0; k < this.numFreqBins; k++){
    var profile = []
    for(var i = 0; i< this.gridSize; i++){
      var layer = []
      for(var j = 0; j< this.gridSize; j++){
        var l = Math.floor(Math.random()*k/2)
        layer.push(Math.cos(Math.PI*l*i/this.gridSize)*Math.cos(Math.PI*(k-l)*j/this.gridSize/2))
      }
      profile.push(layer)
    }
    this.profiles.push(profile)
  }

  this.light = new THREE.PointLight( 0xFFFFFF, 1, 100 )
  this.light.position.set(this.camera.position.x,this.camera.position.y,this.camera.position.z)
  this.scene.add( this.light )



  this.barkScaleFrequencyData = this.analyser.barkScaleFrequencyData().frequencies

  this.cyanLight = new THREE.PointLight(0x00FFFF, 1, 100)
  this.cyanLight.position.set(100*Math.sin(Date.now()*0.001),0,0)
  this.scene.add(this.cyanLight)

  this.magentaLight = new THREE.PointLight(0xFF00FF, 1, 100)
  this.magentaLight.position.set(0,100*Math.sin(Date.now()*0.001),0)
  this.scene.add(this.magentaLight)

  this.yellowLight = new THREE.PointLight(0xFFFF00, 1, 100)
  this.yellowLight.position.set(0,0,100*Math.sin(Date.now()*0.001))
  this.scene.add(this.yellowLight)

  this.xtwist = 0
  this.dxtwist = 0
  this.ddxtwist = 0
  this.ytwist = 0
  this.dytwist = 0
  this.ddytwist = 0
  this.ztwist = 0
  this.dztwist = 0
  this.ddztwist = 0

  }

  render () {

    this.cyanLight.position.set(100*Math.sin(Date.now()*0.001),0,0)
    this.magentaLight.position.set(0,100*Math.sin(Date.now()*0.001),0)
    this.yellowLight.position.set(0,0,100*Math.sin(Date.now()*0.001))


    //
    // if(this.rotate){
    //   this.cube.rotation.x+= this.applyGate(this.analyser.equalTemperedFrequencyData(3).frequencies[0])/1000
    //   this.cube.rotation.y+=this.applyGate(this.analyser.equalTemperedFrequencyData(3).frequencies[1])/1000
    //   this.cube.rotation.z+=this.applyGate(this.analyser.equalTemperedFrequencyData(3).frequencies[2])/1000
    //
    // }

    this.barkScaleFrequencyData = this.analyser.barkScaleFrequencyData().frequencies



    // this.light.position.addScaledVector(new THREE.Vector3(
    //   this.equalTemperedFrequencyData[0],
    //   this.equalTemperedFrequencyData[1],
    //   this.equalTemperedFrequencyData[2]
    // ),0.1)

    // this.light.position.x += Math.random()

    this.light.position.set(this.camera.position.x,this.camera.position.y,this.camera.position.z)
    this.overallAmplitude = this.analyser.barkScaleFrequencyData().overallAmplitude
    this.light.intensity = this.overallAmplitude/200

    this.nematize(this.barkScaleFrequencyData)

    this.renderer.render(this.scene, this.camera)

  }

  nematize (fft) {

    this.xtwist += this.dxtwist*0.0005 + 0.0001*this.applyGate(fft[0])*Math.sin(Date.now()*0.001)
    this.ytwist += this.dytwist*0.0005 + 0.0001*this.applyGate(fft[0])*Math.sin(Date.now()*0.002)
    this.ztwist += this.dztwist*0.0005 + 0.0001*this.applyGate(fft[0])*Math.sin(Date.now()*0.003)

    this.dxtwist += 0.0001*this.applyGate(fft[0])*Math.sin(Date.now()*0.001) + this.ddxtwist*0.01
    this.dytwist += 0.0001*this.applyGate(fft[0])*Math.sin(Date.now()*0.002) + this.ddytwist*0.01
    this.dztwist += 0.0001*this.applyGate(fft[0])*Math.sin(Date.now()*0.003) + this.ddztwist*0.01

    this.ddxtwist = - this.xtwist*this.spring - this.dxtwist*this.drag
    this.ddytwist = - this.ytwist*this.spring - this.dytwist*this.drag
    this.ddztwist = - this.ztwist*this.spring - this.dztwist*this.drag

    this.fibers.forEach((f) => {
      // 0,2,5,7
      f.geometry.vertices[0].z = 10
      f.geometry.vertices[2].z = 10
      f.geometry.vertices[5].z = 10
      f.geometry.vertices[7].z = 10

      for(var k = 0; k < this.numFreqBins; k++){
        f.geometry.vertices[0].z += 0.1*fft[k]*this.profiles[k][f.i][f.j]
        f.geometry.vertices[2].z += 0.1*fft[k]*this.profiles[k][f.i][f.j]
        f.geometry.vertices[5].z += 0.1*fft[k]*this.profiles[k][f.i][f.j]
        f.geometry.vertices[7].z += 0.1*fft[k]*this.profiles[k][f.i][f.j]

      }

      f.geometry.verticesNeedUpdate = true
      f.rotation.x = this.xtwist*(f.i-this.m/2)
      f.rotation.y = this.ytwist*(f.i-this.m/2)
      f.rotation.z = this.ztwist*(f.j-this.m/2)
      // f.rotation.y = 0.00001*this.applyGate(fft[0])*(f.j+this.m/2)
      // f.rotation.z = 0.0001*fft[2]*(f.i-this.m/2)
      // // f.rotation.y += 0.0001*this.gate(fft[0])*(f.i-this.m/2)
      // f.rotation.z += 0.0001*this.gate(fft[0])*(f.i-this.m/2)


    })

    // if(this.gaze){
    //   this.fibers.forEach((f) => {
    //     f.lookAt(this.cyanLight.position)
    //   })
    // }



    // this.fibers.forEach((f) => {
    //   f.translateX(-f.i)
    //   f.translateY(-f.j)
    //   f.lookAt(this.camera.position)
    //   f.translateX(f.i)
    //   f.translateY(f.j)
    // })


      // this.fibers.forEach((f) => {
      //   f.translateX(this.m-2*f.i)
      //   f.translateY(this.n-2*f.j)
      //   f.lookAt(this.camera.position)
      //   f.translateX(-this.m+2*f.i)
      //   f.translateY(-this.n+2*f.j)
      // })


  }

  // 'private'

  applyGate(v) {

    if (v < this.gate*this.overallAmplitude/200){
      return 0
    }
    else {
      return v*this.overallAmplitude/200
    }

  }

  _addCubeToScene() {
    var geometry = new THREE.SphereGeometry( 5, 3, 3 )
    var material = new THREE.MeshNormalMaterial()
    this.cube = new THREE.Mesh(geometry,material)
    this.scene.add(this.cube)
  }

  createFibers (m,n) {
    this.m = m
    this.n = n
    this.fibers = []
    // const material = new THREE.MeshNormalMaterial()
    const material = new THREE.MeshPhongMaterial()
    // const material = new THREE.MeshToonMaterial()
    for(var i = 0; i < m; i++){
      for(var j = 0; j < n; j++){
        const geometry = new THREE.BoxGeometry(1, 1, 10)
        geometry.computeBoundingBox()
        geometry.translate(-m + 2*i,-n + 2*j,0)
        const mesh = new THREE.Mesh(geometry, material)
        mesh.i = i
        mesh.j = j
        var box = new THREE.Box3()
        box.setFromPoints( mesh.geometry.vertices )
        box.getCenter( mesh.position )

        var pivot = new THREE.Group();
        this.scene.add( pivot )
        pivot.add(mesh)
        mesh.pivot = pivot

        this.fibers.push(mesh)



        this.scene.add(mesh)
      }
    }
  }

}

module.exports = Environment
