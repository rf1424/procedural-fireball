import {vec2, mat4, vec4} from 'gl-matrix';
import Drawable from './Drawable';
import Camera from '../../Camera';
import {gl} from '../../globals';
import ShaderProgram from './ShaderProgram';

// In this file, `gl` is accessible because it is imported above
class OpenGLRenderer {

  // framebuffer: WebGLFramebuffer | null = null;
  sceneFramebuffer: WebGLFramebuffer | null = null;
  sceneTexture: WebGLTexture | null = null;
  bloomFramebuffer: WebGLFramebuffer | null = null;
  bloomTexture: WebGLTexture | null = null;
  

  constructor(public canvas: HTMLCanvasElement) {
      this.initFrameBuffersTextures();
  }

  setClearColor(r: number, g: number, b: number, a: number) {
    gl.clearColor(r, g, b, a);
  }

  setSize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  render(camera: Camera, prog: ShaderProgram, drawables: Array<Drawable>,
        baseColor: number[], time: number, gradientColor : number, swayLevel : number, frameThreshold : number) {
    let model = mat4.create();
    let viewProj = mat4.create();
    // let color = vec4.fromValues(1, 0, 0, 1);
    let color = vec4.fromValues(baseColor[0]/255.0, baseColor[1]/255.0, baseColor[2]/255.0, 1);

    mat4.identity(model);
    mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);
    prog.setModelMatrix(model);
    prog.setCameraPosition(camera.position);
    prog.setViewProjMatrix(viewProj);
    prog.setGeometryColor(color);
    prog.setTime(time);
    prog.setGradientType(gradientColor);
    prog.setSwayLevel(swayLevel);
    prog.setFrameThreshold(frameThreshold);

    for (let drawable of drawables) {
      prog.draw(drawable);}
  }

  renderFullscreenQuad(prog: ShaderProgram, quad : Drawable, resolution: vec2, time: number) {
    prog.setResolution(resolution);
    prog.setTime(time);
    prog.draw(quad);
  }

  initFrameBuffersTextures() {
      this.sceneFramebuffer = gl.createFramebuffer();
      this.sceneTexture = gl.createTexture();

      this.bloomFramebuffer = gl.createFramebuffer();
      this.bloomTexture = gl.createTexture();

      this.resizeBuffers();
  }

  resizeBuffers() {
      let width = window.innerWidth;
      let height = window.innerHeight;

      // bind texures to buffers
      // 0. scene  framebuffer
      gl.bindTexture(gl.TEXTURE_2D, this.sceneTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneFramebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.sceneTexture, 0);

      // 1. bloom framebuffer
      gl.bindTexture(gl.TEXTURE_2D, this.bloomTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFramebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.bloomTexture, 0);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

   
};

export default OpenGLRenderer;
