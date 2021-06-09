import { expect } from "chai";
import { mat4, quat, vec3 } from "gl-matrix";
import { EngineObject } from "../client/ts/game/object/EngineObject";
import { GameObject } from "../client/ts/game/object/game/GameObject";
import { RenderContext } from "../client/ts/game/render/RenderContext";

class stubObject extends EngineObject {
  getChild() {
    return null;
  }

  getChildren() {
    return null;
  }
}

class stubGameObject extends GameObject {
  renderMaterial(rc: RenderContext) {
    return null;
  }
}

describe("Object", function() {
  it("Should generate unique IDs on construction", function() {
    let ids : Set<number> = new Set();
    for (let i = 0; i < 32; i++) {
      let obj = new stubObject(null);
      expect(ids.has(obj.getId())).to.be.false;
      ids.add(obj.getId());
    }
  });
});

describe("GameObject", function() {
  it("Should handle transformations properly", function() {
    let obj = new stubGameObject(null);
    const ROT = Math.PI / 4;
    obj.setRotationEuler(ROT, ROT, ROT);

    let pos_verify = vec3.create();
    pos_verify[0] = 1;
    pos_verify[1] = 2;
    pos_verify[2] = 3;

    obj.setPosition(pos_verify);
    obj.setScale(2, 3, 4);

    // ensure transformation data can be returned
    let rot_test = obj.getRotation();
    let rot_verify = quat.fromEuler(quat.create(), ROT, ROT, ROT);

    for (let i = 0; i < 4; i++) {
      expect(rot_test[i]).to.equal(rot_verify[i]);
    }

    let pos_test = obj.getPosition();

    for (let i = 0; i < 4; i++) {
      expect(pos_test[i]).to.equal(pos_verify[i]);
    }

    let truth = mat4.create();
    mat4.identity(truth);
    
    // translate
    let tl = vec3.create();
    tl[0] = 1;
    tl[1] = 2;
    tl[2] = 3;
    mat4.translate(truth, truth, tl);

    // rotate
    let rotmat = mat4.create();
    mat4.identity(rotmat);
    let qua = quat.create();
    quat.fromEuler(qua, ROT, ROT, ROT);
    mat4.fromQuat(rotmat, qua);
    mat4.mul(truth, truth, rotmat);

    let temp = mat4.create();
    mat4.copy(temp, truth);
    
    // scale
    let scale = vec3.create();
    scale[0] = 2;
    scale[1] = 3;
    scale[2] = 4;
    mat4.scale(truth, truth, scale);

    scale[0] = 5;
    scale[1] = 6;
    scale[2] = 7;
    mat4.scale(temp, temp, scale);

    let comp = obj.getTransformationMatrix();
    for (let i = 0; i < 16; i++) {
      expect(comp[i]).is.approximately(truth[i], 0.0001, "Matrices are not equal!");
    }

    obj.setScale(5, 6, 7);
    comp = obj.getTransformationMatrix();
    for (let i = 0; i < 16; i++) {
      expect(comp[i]).is.approximately(temp[i], 0.0001, "Matrices are not equal!");
    }

    // ensure caching behavior works
    comp = obj.getTransformationMatrix();
    for (let i = 0; i < 16; i++) {
      expect(comp[i]).is.approximately(temp[i], 0.0001, "Matrices are not equal!");
    }
  })
})