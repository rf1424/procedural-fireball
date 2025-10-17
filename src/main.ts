import {vec2, vec3} from 'gl-matrix';
const Stats = require('stats-js');
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import Cube from './geometry/Cube';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  'Load Scene': loadScene, // A function pointer, essentially
   baseColor: [51, 51, 51],
   gradientType : 6,
   swayLevel : 0.15,
   frameThreshold: 0.5,
   default: getDefaults
};

let icosphere: Icosphere;
let icosphere2: Icosphere;
let icosphere3: Icosphere;
let square: Square
let cube: Cube;
let prevTesselations: number = 5;

function getDefaults() {
    controls.tesselations = 5;
    controls.baseColor = [51, 51, 51];
    controls.gradientType = 6;
    controls.swayLevel = 0.15;
    controls.frameThreshold = 0.5;
    return;
}
function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'tesselations', 0, 8).step(1);
  gui.add(controls, 'Load Scene');
  gui.add(controls, 'gradientType', 0, 7,).step(1);
  gui.add(controls, 'swayLevel', 0.0, 1.0).step(0.01);
  gui.add(controls, 'frameThreshold', 0.1, 1.0).step(0.01);
  gui.add(controls, 'default');


  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0., 0., 0., 1);
  gl.enable(gl.DEPTH_TEST);
  const baseShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const topShader = new ShaderProgram([
        new Shader(gl.VERTEX_SHADER, require('./shaders/layer-vert.glsl')),
        new Shader(gl.FRAGMENT_SHADER, require('./shaders/layer-frag.glsl')),
  ]);
  
  const bloomExtractShader = new ShaderProgram([
        new Shader(gl.VERTEX_SHADER, require('./shaders/passthroughQuad-vert.glsl')),
        new Shader(gl.FRAGMENT_SHADER, require('./shaders/bloomExtract-frag.glsl')),
  ]);
  
  const blurrAndCombineShader = new ShaderProgram([
        new Shader(gl.VERTEX_SHADER, require('./shaders/passthroughQuad-vert.glsl')),
        new Shader(gl.FRAGMENT_SHADER, require('./shaders/bloomCombine-frag.glsl')),
  ]);
  

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();

    // parameter/attributes updates
    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
      }
    const resolution = vec2.fromValues(window.innerWidth, window.innerHeight);
    const time = performance.now();

    // 1. first pass, icosphere fire geometry
    gl.bindFramebuffer(gl.FRAMEBUFFER, renderer.sceneFramebuffer);
    
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    
    gl.enable(gl.CULL_FACE);
    renderer.render(camera, baseShader, [
       icosphere
       // square,
       // cube
    ], controls.baseColor, time, controls.gradientType, controls.swayLevel, controls.frameThreshold);
    gl.disable(gl.CULL_FACE);
    
    renderer.render(camera, topShader, [
         icosphere
    ], controls.baseColor, time, controls.gradientType, controls.swayLevel, controls.frameThreshold);

    
    // 2. second pass
    gl.disable(gl.DEPTH_TEST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, renderer.bloomFramebuffer);
    
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, renderer.sceneTexture);
    bloomExtractShader.setSceneTexture(0);
    renderer.clear();
    renderer.renderFullscreenQuad(bloomExtractShader, square, resolution, time);
    

    // 3. third pass
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); // null -> screen
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, renderer.sceneTexture);
    blurrAndCombineShader.setSceneTexture(0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, renderer.bloomTexture);
    blurrAndCombineShader.setBloomTexture(1);
    renderer.clear();
    renderer.renderFullscreenQuad(blurrAndCombineShader, square, resolution, time);
    
    gl.enable(gl.DEPTH_TEST);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.resizeBuffers();
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();

  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
