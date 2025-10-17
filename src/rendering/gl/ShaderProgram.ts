import {vec2, vec3, vec4, mat4} from 'gl-matrix';
import Drawable from './Drawable';
import {gl} from '../../globals';

var activeProgram: WebGLProgram = null;

export class Shader {
  shader: WebGLShader;

  constructor(type: number, source: string) {
    this.shader = gl.createShader(type);
    gl.shaderSource(this.shader, source);
    gl.compileShader(this.shader);

    if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(this.shader);
    }
  }
};

class ShaderProgram {
  prog: WebGLProgram;

  attrPos: number;
  attrNor: number;
  attrCol: number;

  unifModel: WebGLUniformLocation;
  unifModelInvTr: WebGLUniformLocation;
  unifViewProj: WebGLUniformLocation;
  unifColor: WebGLUniformLocation;
  unifTime: WebGLUniformLocation;
  unifGradientType: WebGLUniformLocation;
  unifSwayLevel: WebGLUniformLocation;
  unifFrameThreshold: WebGLUniformLocation;
  unifCameraPos: WebGLUniformLocation;
  unifResolution: WebGLUniformLocation;

  unifSceneTexture: WebGLUniformLocation;
  unifCombineBloomTexture: WebGLUniformLocation;

  constructor(shaders: Array<Shader>) {
    this.prog = gl.createProgram();

    for (let shader of shaders) {
      gl.attachShader(this.prog, shader.shader);
    }
    gl.linkProgram(this.prog);
    if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(this.prog);
    }

    this.attrPos = gl.getAttribLocation(this.prog, "vs_Pos");
    this.attrNor = gl.getAttribLocation(this.prog, "vs_Nor");
    this.attrCol = gl.getAttribLocation(this.prog, "vs_Col");
    this.unifModel      = gl.getUniformLocation(this.prog, "u_Model");
    this.unifModelInvTr = gl.getUniformLocation(this.prog, "u_ModelInvTr");
    this.unifViewProj   = gl.getUniformLocation(this.prog, "u_ViewProj");
    this.unifColor = gl.getUniformLocation(this.prog, "u_Color");
    this.unifTime = gl.getUniformLocation(this.prog, "u_Time");
    this.unifGradientType = gl.getUniformLocation(this.prog, "u_GradientType");
    this.unifSwayLevel = gl.getUniformLocation(this.prog, "u_swayLevel");
    this.unifFrameThreshold = gl.getUniformLocation(this.prog, "u_frameThreshold");
    this.unifCameraPos = gl.getUniformLocation(this.prog, "u_CamPos");
    this.unifResolution = gl.getUniformLocation(this.prog, "u_Resolution");
    
    this.unifSceneTexture = gl.getUniformLocation(this.prog, "u_Scene");
    this.unifCombineBloomTexture = gl.getUniformLocation(this.prog, "u_Bloom");
  }

  use() {
    if (activeProgram !== this.prog) {
      gl.useProgram(this.prog);
      activeProgram = this.prog;
    }
  }

  setModelMatrix(model: mat4) {
    this.use();
    if (this.unifModel !== -1) {
      gl.uniformMatrix4fv(this.unifModel, false, model);
    }

    if (this.unifModelInvTr !== -1) {
      let modelinvtr: mat4 = mat4.create();
      mat4.transpose(modelinvtr, model);
      mat4.invert(modelinvtr, modelinvtr);
      gl.uniformMatrix4fv(this.unifModelInvTr, false, modelinvtr);
    }
  }

  setViewProjMatrix(vp: mat4) {
    this.use();
    if (this.unifViewProj !== -1) {
      gl.uniformMatrix4fv(this.unifViewProj, false, vp);
    }
  }

  setCameraPosition(pos: vec3) {
      this.use();
      if (this.unifCameraPos !== -1) {
          gl.uniform3fv(this.unifCameraPos, pos);
      } else {
      }
   }

  setGeometryColor(color: vec4) {
    this.use();
    if (this.unifColor !== -1) {
      gl.uniform4fv(this.unifColor, color);
    }
    }

    setGradientType(type: number) {
        this.use();
        if (this.unifGradientType !== -1) {
            gl.uniform1f(this.unifGradientType, type);
        }
    }

    setSwayLevel(level: number) {
        this.use();
        if (this.unifSwayLevel !== -1) {
            gl.uniform1f(this.unifSwayLevel, level);
        }
    }

    setFrameThreshold(threshold: number) {
        this.use();
        if (this.unifFrameThreshold !== -1) {
            gl.uniform1f(this.unifFrameThreshold, threshold);
        }
    }

  setTime(t: number) {
      this.use();
      if (this.unifTime !== -1) {
         gl.uniform1f(this.unifTime, t);
      }
  }

  setResolution(resolution: vec2) {
        this.use();
        if (this.unifResolution !== -1) {
             gl.uniform2fv(this.unifResolution, resolution);
        }
    }
  
  setSceneTexture(textureUnit: number) {
        this.use();
        if (this.unifSceneTexture !== -1) {
            gl.uniform1i(this.unifSceneTexture, textureUnit);
        }
  }

  setBloomTexture(textureUnit: number) {
        this.use();
        if (this.unifCombineBloomTexture !== -1) {
            gl.uniform1i(this.unifCombineBloomTexture, textureUnit);
        }
  }

  /*
  setTexture(name: string, texture: WebGLTexture | null, textureUnit : number = 0) {
        this.use();
        let location = gl.getUniformLocation(this.prog, name);
        gl.activeTexture(gl.TEXTURE0 + textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        gl.uniform1i(location, textureUnit);
  }
  */

  draw(d: Drawable) {
    this.use();

    if (this.attrPos != -1 && d.bindPos()) {
      gl.enableVertexAttribArray(this.attrPos);
      gl.vertexAttribPointer(this.attrPos, 4, gl.FLOAT, false, 0, 0);
    }

    if (this.attrNor != -1 && d.bindNor()) {
      gl.enableVertexAttribArray(this.attrNor);
      gl.vertexAttribPointer(this.attrNor, 4, gl.FLOAT, false, 0, 0);
    }

    d.bindIdx();
    gl.drawElements(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0);

    if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);
    if (this.attrNor != -1) gl.disableVertexAttribArray(this.attrNor);
  }
};

export default ShaderProgram;
