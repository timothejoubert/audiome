"use strict";

var CABLES=CABLES||{};
CABLES.OPS=CABLES.OPS||{};

var Ops=Ops || {};
Ops.Ui=Ops.Ui || {};
Ops.Gl=Ops.Gl || {};
Ops.Math=Ops.Math || {};
Ops.Html=Ops.Html || {};
Ops.Anim=Ops.Anim || {};
Ops.Value=Ops.Value || {};
Ops.Boolean=Ops.Boolean || {};
Ops.Devices=Ops.Devices || {};
Ops.Gl.Shader=Ops.Gl.Shader || {};
Ops.Gl.Meshes=Ops.Gl.Meshes || {};
Ops.Gl.Matrix=Ops.Gl.Matrix || {};
Ops.Gl.Textures=Ops.Gl.Textures || {};
Ops.Math.Compare=Ops.Math.Compare || {};
Ops.Devices.Mouse=Ops.Devices.Mouse || {};



// **************************************************************
// 
// Ops.Gl.MainLoop
// 
// **************************************************************

Ops.Gl.MainLoop = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const fpsLimit=op.inValue("FPS Limit",0);
const trigger=op.outTrigger("trigger");
const width=op.outValue("width");
const height=op.outValue("height");
const reduceLoadingFPS=op.inValueBool("Reduce FPS loading");
const clear=op.inValueBool("Clear",true);
const clearAlpha=op.inValueBool("ClearAlpha",true);
const fullscreen=op.inValueBool("Fullscreen Button",false);
const active=op.inValueBool("Active",true);
const hdpi=op.inValueBool("Hires Displays",false);

op.onAnimFrame=render;
hdpi.onChange=function()
{
    if(hdpi.get()) op.patch.cgl.pixelDensity=window.devicePixelRatio;
        else op.patch.cgl.pixelDensity=1;

    op.patch.cgl.updateSize();
    if(CABLES.UI) gui.setLayout();
};

active.onChange=function()
{
    op.patch.removeOnAnimFrame(op);

    if(active.get())
    {
        op.setUiAttrib({"extendTitle":""});
        op.onAnimFrame=render;
        op.patch.addOnAnimFrame(op);
        op.log("adding again!");
    }
    else
    {
        op.setUiAttrib({"extendTitle":"Inactive"});
    }

};

var cgl=op.patch.cgl;
var rframes=0;
var rframeStart=0;

if(!op.patch.cgl) op.uiAttr( { 'error': 'No webgl cgl context' } );

var identTranslate=vec3.create();
vec3.set(identTranslate, 0,0,0);
var identTranslateView=vec3.create();
vec3.set(identTranslateView, 0,0,-2);

fullscreen.onChange=updateFullscreenButton;
setTimeout(updateFullscreenButton,100);
var fsElement=null;

function updateFullscreenButton()
{
    function onMouseEnter()
    {
        if(fsElement)fsElement.style.display="block";
    }

    function onMouseLeave()
    {
        if(fsElement)fsElement.style.display="none";
    }

    op.patch.cgl.canvas.addEventListener('mouseleave', onMouseLeave);
    op.patch.cgl.canvas.addEventListener('mouseenter', onMouseEnter);

    if(fullscreen.get())
    {
        if(!fsElement)
        {
            fsElement = document.createElement('div');

            var container = op.patch.cgl.canvas.parentElement;
            if(container)container.appendChild(fsElement);

            fsElement.addEventListener('mouseenter', onMouseEnter);
            fsElement.addEventListener('click', function(e)
            {
                if(CABLES.UI && !e.shiftKey) gui.cycleRendererSize();
                else cgl.fullScreen();
            });
        }

        fsElement.style.padding="10px";
        fsElement.style.position="absolute";
        fsElement.style.right="5px";
        fsElement.style.top="5px";
        fsElement.style.width="20px";
        fsElement.style.height="20px";
        fsElement.style.cursor="pointer";
        fsElement.style['border-radius']="40px";
        fsElement.style.background="#444";
        fsElement.style["z-index"]="9999";
        fsElement.style.display="none";
        fsElement.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Capa_1" x="0px" y="0px" viewBox="0 0 490 490" style="width:20px;height:20px;" xml:space="preserve" width="512px" height="512px"><g><path d="M173.792,301.792L21.333,454.251v-80.917c0-5.891-4.776-10.667-10.667-10.667C4.776,362.667,0,367.442,0,373.333V480     c0,5.891,4.776,10.667,10.667,10.667h106.667c5.891,0,10.667-4.776,10.667-10.667s-4.776-10.667-10.667-10.667H36.416     l152.459-152.459c4.093-4.237,3.975-10.99-0.262-15.083C184.479,297.799,177.926,297.799,173.792,301.792z" fill="#FFFFFF"/><path d="M480,0H373.333c-5.891,0-10.667,4.776-10.667,10.667c0,5.891,4.776,10.667,10.667,10.667h80.917L301.792,173.792     c-4.237,4.093-4.354,10.845-0.262,15.083c4.093,4.237,10.845,4.354,15.083,0.262c0.089-0.086,0.176-0.173,0.262-0.262     L469.333,36.416v80.917c0,5.891,4.776,10.667,10.667,10.667s10.667-4.776,10.667-10.667V10.667C490.667,4.776,485.891,0,480,0z" fill="#FFFFFF"/><path d="M36.416,21.333h80.917c5.891,0,10.667-4.776,10.667-10.667C128,4.776,123.224,0,117.333,0H10.667     C4.776,0,0,4.776,0,10.667v106.667C0,123.224,4.776,128,10.667,128c5.891,0,10.667-4.776,10.667-10.667V36.416l152.459,152.459     c4.237,4.093,10.99,3.975,15.083-0.262c3.992-4.134,3.992-10.687,0-14.82L36.416,21.333z" fill="#FFFFFF"/><path d="M480,362.667c-5.891,0-10.667,4.776-10.667,10.667v80.917L316.875,301.792c-4.237-4.093-10.99-3.976-15.083,0.261     c-3.993,4.134-3.993,10.688,0,14.821l152.459,152.459h-80.917c-5.891,0-10.667,4.776-10.667,10.667s4.776,10.667,10.667,10.667     H480c5.891,0,10.667-4.776,10.667-10.667V373.333C490.667,367.442,485.891,362.667,480,362.667z" fill="#FFFFFF"/></g></svg>';
    }
    else
    {
        if(fsElement)
        {
            fsElement.style.display="none";
            fsElement.remove();
            fsElement=null;
        }
    }
}

fpsLimit.onChange=function()
{
    op.patch.config.fpsLimit=fpsLimit.get()||0;
};

op.onDelete=function()
{
    cgl.gl.clearColor(0,0,0,0);
    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
};

op.patch.loading.setOnFinishedLoading(function(cb)
{
    op.patch.config.fpsLimit=fpsLimit.get();
});


function render(time)
{
    if(!active.get())return;
    if(cgl.aborted || cgl.canvas.clientWidth===0 || cgl.canvas.clientHeight===0)return;

    const startTime=performance.now();

    if(op.patch.loading.getProgress()<1.0 && reduceLoadingFPS.get())
    {
        op.patch.config.fpsLimit=5;
    }

    if(cgl.canvasWidth==-1)
    {
        cgl.setCanvas(op.patch.config.glCanvasId);
        return;
    }

    if(cgl.canvasWidth!=width.get() || cgl.canvasHeight!=height.get())
    {
        width.set(cgl.canvasWidth);
        height.set(cgl.canvasHeight);
    }

    if(CABLES.now()-rframeStart>1000)
    {
        CGL.fpsReport=CGL.fpsReport||[];
        if(op.patch.loading.getProgress()>=1.0 && rframeStart!==0)CGL.fpsReport.push(rframes);
        rframes=0;
        rframeStart=CABLES.now();
    }
    CGL.MESH.lastShader=null;
    CGL.MESH.lastMesh=null;

    cgl.renderStart(cgl,identTranslate,identTranslateView);

    if(clear.get())
    {
        cgl.gl.clearColor(0,0,0,1);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
    }

    trigger.trigger();

    if(CGL.MESH.lastMesh)CGL.MESH.lastMesh.unBind();

    if(CGL.Texture.previewTexture)
    {
        if(!CGL.Texture.texturePreviewer) CGL.Texture.texturePreviewer=new CGL.Texture.texturePreview(cgl);
        CGL.Texture.texturePreviewer.render(CGL.Texture.previewTexture);
    }
    cgl.renderEnd(cgl);

    if(clearAlpha.get())
    {
        cgl.gl.clearColor(1, 1, 1, 1);
        cgl.gl.colorMask(false, false, false, true);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT);
        cgl.gl.colorMask(true, true, true, true);
    }

    if(!cgl.frameStore.phong)cgl.frameStore.phong={};
    rframes++;

    CGL.profileData.profileMainloopMs=performance.now()-startTime;

};











};

Ops.Gl.MainLoop.prototype = new CABLES.Op();
CABLES.OPS["b0472a1d-db16-4ba6-8787-f300fbdc77bb"]={f:Ops.Gl.MainLoop,objName:"Ops.Gl.MainLoop"};




// **************************************************************
// 
// Ops.Ui.Comment
// 
// **************************************************************

Ops.Ui.Comment = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
op.inTitle=op.inString("title",' ');
op.text=op.inTextarea("text");

op.text.set(' ');
op.name=' ';

op.inTitle.set('new comment');

op.inTitle.onChange=update;
op.text.onChange=update;
op.onLoaded=update;


update();

function update()
{
    if(CABLES.UI)
    {
        op.uiAttr(
            {
                'comment_title':op.inTitle.get(),
                'comment_text':op.text.get()
            });

        op.name=op.inTitle.get();

    }
}




};

Ops.Ui.Comment.prototype = new CABLES.Op();
CABLES.OPS["9de0c04f-666b-47cd-9722-a8cf36ab4720"]={f:Ops.Ui.Comment,objName:"Ops.Ui.Comment"};




// **************************************************************
// 
// Ops.Gl.Texture
// 
// **************************************************************

Ops.Gl.Texture = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var filename=op.inFile("file","image");
var tfilter=op.inSwitch("filter",['nearest','linear','mipmap']);
var wrap=op.inValueSelect("wrap",['repeat','mirrored repeat','clamp to edge'],"clamp to edge");
var flip=op.inValueBool("flip",false);
var unpackAlpha=op.inValueBool("unpackPreMultipliedAlpha",false);
var aniso=op.inSwitch("Anisotropic",[0,1,2,4,8,16],0);

var textureOut=op.outTexture("texture");
var width=op.outValue("width");
var height=op.outValue("height");
var loading=op.outValue("loading");
var ratio=op.outValue("Aspect Ratio");

op.setPortGroup("Size",[width,height]);

unpackAlpha.hidePort();

op.toWorkPortsNeedToBeLinked(textureOut);

const cgl=op.patch.cgl;
var cgl_filter=0;
var cgl_wrap=0;
var cgl_aniso=0;

filename.onChange=flip.onChange=function(){reloadSoon();};

aniso.onChange=tfilter.onChange=onFilterChange;
wrap.onChange=onWrapChange;
unpackAlpha.onChange=function(){ reloadSoon(); };

var timedLoader=0;

tfilter.set('mipmap');
wrap.set('repeat');

textureOut.set(CGL.Texture.getEmptyTexture(cgl));

var setTempTexture=function()
{
    var t=CGL.Texture.getTempTexture(cgl);
    textureOut.set(t);
};

var loadingId=null;
var tex=null;
function reloadSoon(nocache)
{
    clearTimeout(timedLoader);
    timedLoader=setTimeout(function()
    {
        realReload(nocache);
    },30);
}

function realReload(nocache)
{
    if(!loadingId)loadingId=cgl.patch.loading.start('textureOp',filename.get());

    var url=op.patch.getFilePath(String(filename.get()));
    if(nocache)url+='?rnd='+CABLES.generateUUID();

    if((filename.get() && filename.get().length>1))
    {
        loading.set(true);




        if(tex)tex.delete();
        tex=CGL.Texture.load(cgl,url,
            function(err)
            {
                if(err)
                {
                    setTempTexture();
                    op.uiAttr({'error':'could not load texture "'+filename.get()+'"'});
                    cgl.patch.loading.finished(loadingId);
                    return;
                }
                else op.uiAttr({'error':null});
                textureOut.set(tex);
                width.set(tex.width);
                height.set(tex.height);
                ratio.set(tex.width/tex.height);

                if(!tex.isPowerOfTwo()) op.uiAttr(
                    {
                        hint:'texture dimensions not power of two! - texture filtering will not work.',
                        warning:null
                    });
                    else op.uiAttr(
                        {
                            hint:null,
                            warning:null
                        });

                textureOut.set(null);
                textureOut.set(tex);
                // tex.printInfo();

            },{
                anisotropic:cgl_aniso,
                wrap:cgl_wrap,
                flip:flip.get(),
                unpackAlpha:unpackAlpha.get(),
                filter:cgl_filter
            });

        textureOut.set(null);
        textureOut.set(tex);

        if(!textureOut.get() && nocache)
        {
        }

        cgl.patch.loading.finished(loadingId);
    }
    else
    {
        cgl.patch.loading.finished(loadingId);
        setTempTexture();
    }
}

function onFilterChange()
{
    if(tfilter.get()=='nearest') cgl_filter=CGL.Texture.FILTER_NEAREST;
    else if(tfilter.get()=='linear') cgl_filter=CGL.Texture.FILTER_LINEAR;
    else if(tfilter.get()=='mipmap') cgl_filter=CGL.Texture.FILTER_MIPMAP;
    else if(tfilter.get()=='Anisotropic') cgl_filter=CGL.Texture.FILTER_ANISOTROPIC;

    cgl_aniso=parseFloat(aniso.get());

    reloadSoon();
}

function onWrapChange()
{
    if(wrap.get()=='repeat') cgl_wrap=CGL.Texture.WRAP_REPEAT;
    if(wrap.get()=='mirrored repeat') cgl_wrap=CGL.Texture.WRAP_MIRRORED_REPEAT;
    if(wrap.get()=='clamp to edge') cgl_wrap=CGL.Texture.WRAP_CLAMP_TO_EDGE;

    reloadSoon();
}

op.onFileChanged=function(fn)
{
    if(filename.get() && filename.get().indexOf(fn)>-1)
    {
        textureOut.set(null);
        textureOut.set(CGL.Texture.getTempTexture(cgl));

        realReload(true);
    }
};







};

Ops.Gl.Texture.prototype = new CABLES.Op();
CABLES.OPS["466394d4-6c1a-4e5d-a057-0063ab0f096a"]={f:Ops.Gl.Texture,objName:"Ops.Gl.Texture"};




// **************************************************************
// 
// Ops.Gl.Matrix.Transform
// 
// **************************************************************

Ops.Gl.Matrix.Transform = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    render=op.inTrigger("render"),
    posX=op.inValue("posX",0),
    posY=op.inValue("posY",0),
    posZ=op.inValue("posZ",0),
    scale=op.inValue("scale",1),
    rotX=op.inValue("rotX",0),
    rotY=op.inValue("rotY",0),
    rotZ=op.inValue("rotZ",0),
    trigger=op.outTrigger("trigger");

op.setPortGroup('Rotation',[rotX,rotY,rotZ]);
op.setPortGroup('Position',[posX,posY,posZ]);
op.setPortGroup('Scale',[scale]);
op.setUiAxisPorts(posX,posY,posZ);

const cgl=op.patch.cgl;
var vPos=vec3.create();
var vScale=vec3.create();
var transMatrix = mat4.create();
mat4.identity(transMatrix);

var
    doScale=false,
    doTranslate=false,
    translationChanged=true,
    scaleChanged=true,
    rotChanged=true;

rotX.onChange=rotY.onChange=rotZ.onChange=setRotChanged;
posX.onChange=posY.onChange=posZ.onChange=setTranslateChanged;
scale.onChange=setScaleChanged;

render.onTriggered=function()
{
    // if(!CGL.TextureEffect.checkOpNotInTextureEffect(op)) return;

    var updateMatrix=false;
    if(translationChanged)
    {
        updateTranslation();
        updateMatrix=true;
    }
    if(scaleChanged)
    {
        updateScale();
        updateMatrix=true;
    }
    if(rotChanged) updateMatrix=true;

    if(updateMatrix) doUpdateMatrix();

    cgl.pushModelMatrix();
    mat4.multiply(cgl.mMatrix,cgl.mMatrix,transMatrix);

    trigger.trigger();
    cgl.popModelMatrix();

    if(CABLES.UI && CABLES.UI.showCanvasTransforms) gui.setTransform(op.id,posX.get(),posY.get(),posZ.get());

    if(op.isCurrentUiOp())
        gui.setTransformGizmo(
            {
                posX:posX,
                posY:posY,
                posZ:posZ,
            });
};

op.transform3d=function()
{
    return { pos:[posX,posY,posZ] };
};

function doUpdateMatrix()
{
    mat4.identity(transMatrix);
    if(doTranslate)mat4.translate(transMatrix,transMatrix, vPos);

    if(rotX.get()!==0)mat4.rotateX(transMatrix,transMatrix, rotX.get()*CGL.DEG2RAD);
    if(rotY.get()!==0)mat4.rotateY(transMatrix,transMatrix, rotY.get()*CGL.DEG2RAD);
    if(rotZ.get()!==0)mat4.rotateZ(transMatrix,transMatrix, rotZ.get()*CGL.DEG2RAD);

    if(doScale)mat4.scale(transMatrix,transMatrix, vScale);
    rotChanged=false;
}

function updateTranslation()
{
    doTranslate=false;
    if(posX.get()!==0.0 || posY.get()!==0.0 || posZ.get()!==0.0) doTranslate=true;
    vec3.set(vPos, posX.get(),posY.get(),posZ.get());
    translationChanged=false;
}

function updateScale()
{
    // doScale=false;
    // if(scale.get()!==0.0)
    doScale=true;
    vec3.set(vScale, scale.get(),scale.get(),scale.get());
    scaleChanged=false;
}

function setTranslateChanged()
{
    translationChanged=true;
}

function setScaleChanged()
{
    scaleChanged=true;
}

function setRotChanged()
{
    rotChanged=true;
}

doUpdateMatrix();




};

Ops.Gl.Matrix.Transform.prototype = new CABLES.Op();
CABLES.OPS["650baeb1-db2d-4781-9af6-ab4e9d4277be"]={f:Ops.Gl.Matrix.Transform,objName:"Ops.Gl.Matrix.Transform"};




// **************************************************************
// 
// Ops.Gl.ClearColor
// 
// **************************************************************

Ops.Gl.ClearColor = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    render=op.inTrigger("render"),
    trigger=op.outTrigger("trigger"),
    r=op.inFloatSlider("r",0.1),
    g=op.inFloatSlider("g",0.1),
    b=op.inFloatSlider("b",0.1),
    a=op.inFloatSlider("a",1);

r.setUiAttribs({ colorPick: true });

const cgl=op.patch.cgl;

render.onTriggered=function()
{
    cgl.gl.clearColor(r.get(),g.get(),b.get(),a.get());
    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
    trigger.trigger();
};

};

Ops.Gl.ClearColor.prototype = new CABLES.Op();
CABLES.OPS["19b441eb-9f63-4f35-ba08-b87841517c4d"]={f:Ops.Gl.ClearColor,objName:"Ops.Gl.ClearColor"};




// **************************************************************
// 
// Ops.Gl.Meshes.Cube
// 
// **************************************************************

Ops.Gl.Meshes.Cube = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};

/*
next version:

- make rebuildLater functionality
- make mapping mode for unconnected sides: no more face mapping texture problems (then we don't need that bias...)
- maybe checkboxes to disable some sides ?
- tesselation

*/

const
    render=op.inTrigger('render'),
    width=op.inValue('width',1),
    height=op.inValue('height',1),
    lengt=op.inValue('length',1),
    center=op.inValueBool('center',true),
    active=op.inValueBool('Active',true),
    mapping=op.inSwitch("Mapping",['Default','Cube','Cube Biased'],'Default'),
    trigger=op.outTrigger('trigger'),
    geomOut=op.outObject("geometry");

const cgl=op.patch.cgl;

op.setPortGroup("Geometry",[width,height,lengt]);

var geom=null;
var mesh=null;

mapping.onChange=buildMesh;
width.onChange=buildMesh;
height.onChange=buildMesh;
lengt.onChange=buildMesh;
center.onChange=buildMesh;

buildMesh();


render.onTriggered=function()
{
    if(active.get() && mesh) mesh.render(cgl.getShader());
    trigger.trigger();
};

op.preRender=function()
{
    buildMesh();
    mesh.render(cgl.getShader());
};

function buildMesh()
{
    if(!geom)geom=new CGL.Geometry("cubemesh");
    geom.clear();

    var x=width.get();
    var nx=-1*width.get();
    var y=lengt.get();
    var ny=-1*lengt.get();
    var z=height.get();
    var nz=-1*height.get();

    if(!center.get())
    {
        nx=0;
        ny=0;
        nz=0;
    }
    else
    {
        x*=0.5;
        nx*=0.5;
        y*=0.5;
        ny*=0.5;
        z*=0.5;
        nz*=0.5;
    }

    if(mapping.get()=="Cube" || mapping.get()=="Cube Biased")
        geom.vertices = [
            // Front face
            nx, ny,  z,
            x, ny,  z,
            x,  y,  z,
            nx,  y,  z,
            // Back face
            nx, ny, nz,
            x,  ny, nz,
            x,  y, nz,
            nx, y, nz,
            // Top face
            nx,  y, nz,
            x,  y,  nz,
            x,  y,  z,
            nx,  y, z,
            // Bottom face
            nx, ny, nz,
            x, ny, nz,
            x, ny,  z,
            nx, ny,  z,
            // Right face
            x, ny, nz,
            x, ny, z,
            x,  y, z,
            x, y, nz,
            // zeft face
            nx, ny, nz,
            nx, ny,  z,
            nx,  y,  z,
            nx,  y, nz
            ];

    else
        geom.vertices = [
            // Front face
            nx, ny,  z,
            x, ny,  z,
            x,  y,  z,
            nx,  y,  z,
            // Back face
            nx, ny, nz,
            nx,  y, nz,
            x,  y, nz,
            x, ny, nz,
            // Top face
            nx,  y, nz,
            nx,  y,  z,
            x,  y,  z,
            x,  y, nz,
            // Bottom face
            nx, ny, nz,
            x, ny, nz,
            x, ny,  z,
            nx, ny,  z,
            // Right face
            x, ny, nz,
            x,  y, nz,
            x,  y,  z,
            x, ny,  z,
            // zeft face
            nx, ny, nz,
            nx, ny,  z,
            nx,  y,  z,
            nx,  y, nz
            ];

    if(mapping.get()=="Cube" || mapping.get()=="Cube Biased")
    {
        const sx=0.25;
        const sy=1/3;
        var bias=0.0;
        if(mapping.get()=="Cube Biased")bias=0.01;
        geom.setTexCoords( [
              // Front face   Z+
              sx+bias, sy*2-bias,
              sx*2-bias, sy*2-bias,
              sx*2-bias, sy+bias,
              sx+bias, sy+bias,
              // Back face Z-
              sx*4-bias, sy*2-bias,
              sx*3+bias, sy*2-bias,
              sx*3+bias, sy+bias,
              sx*4-bias, sy+bias,
              // Top face
              sx+bias, 0+bias,
              sx*2-bias, 0+bias,
              sx*2-bias, sy*1-bias,
              sx+bias, sy*1-bias,
              // Bottom face
              sx+bias, sy*2+bias,
              sx*2-bias, sy*2+bias,
              sx*2-bias, sy*3-bias,
              sx+bias, sy*3-bias,
              // Right face
              sx*0+bias, sy+bias,
              sx*1-bias, sy+bias,
              sx*1-bias, sy*2-bias,
              sx*0+bias, sy*2-bias,
              // Left face
              sx*2+bias, sy+bias,
              sx*3-bias, sy+bias,
              sx*3-bias, sy*2-bias,
              sx*2+bias, sy*2-bias,
            ]);

    }

    else
        geom.setTexCoords( [
              // Front face
              0.0, 1.0,
              1.0, 1.0,
              1.0, 0.0,
              0.0, 0.0,
              // Back face
              1.0, 1.0,
              1.0, 0.0,
              0.0, 0.0,
              0.0, 1.0,
              // Top face
              0.0, 0.0,
              0.0, 1.0,
              1.0, 1.0,
              1.0, 0.0,
              // Bottom face
              1.0, 0.0,
              0.0, 0.0,
              0.0, 1.0,
              1.0, 1.0,
              // Right face
              1.0, 1.0,
              1.0, 0.0,
              0.0, 0.0,
              0.0, 1.0,
              // Left face
              0.0, 1.0,
              1.0, 1.0,
              1.0, 0.0,
              0.0, 0.0,
            ]);

    geom.vertexNormals = [
        // Front face
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,

        // Back face
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,

        // Top face
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,

        // Bottom face
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,

        // Right face
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,

        // Left face
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0
    ];
    geom.tangents = [
        // front face
        -1,0,0, -1,0,0, -1,0,0, -1,0,0,
        // back face
        1,0,0, 1,0,0, 1,0,0, 1,0,0,
        // top face
        1,0,0, 1,0,0, 1,0,0, 1,0,0,
        // bottom face
        -1,0,0, -1,0,0, -1,0,0, -1,0,0,
        // right face
        0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
        // left face
        0,0,1, 0,0,1, 0,0,1, 0,0,1
    ];
    geom.biTangents = [
        // front face
        0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0,
        // back face
        0,1,0, 0,1,0, 0,1,0, 0,1,0,
        // top face
        0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
        // bottom face
        0,0,1, 0,0,1, 0,0,1, 0,0,1,
        // right face
        0,1,0, 0,1,0, 0,1,0, 0,1,0,
        // left face
        0,1,0, 0,1,0, 0,1,0, 0,1,0
    ];

    geom.verticesIndices = [
        0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23  // Left face
    ];

    if(mesh)mesh.dispose();
    mesh=new CGL.Mesh(cgl,geom);
    geomOut.set(null);
    geomOut.set(geom);
}


op.onDelete=function()
{
    if(mesh)mesh.dispose();
};



};

Ops.Gl.Meshes.Cube.prototype = new CABLES.Op();
CABLES.OPS["ff0535e2-603a-4c07-9ce6-e9e0db857dfe"]={f:Ops.Gl.Meshes.Cube,objName:"Ops.Gl.Meshes.Cube"};




// **************************************************************
// 
// Ops.Gl.Shader.BasicMaterial_v3
// 
// **************************************************************

Ops.Gl.Shader.BasicMaterial_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={basicmaterial_frag:"{{MODULES_HEAD}}\n\nIN vec2 texCoord;\nUNI vec4 color;\n// UNI float r;\n// UNI float g;\n// UNI float b;\n// UNI float a;\n\n#ifdef HAS_TEXTURES\n    IN vec2 texCoordOrig;\n    #ifdef HAS_TEXTURE_DIFFUSE\n        UNI sampler2D tex;\n    #endif\n    #ifdef HAS_TEXTURE_OPACITY\n        UNI sampler2D texOpacity;\n   #endif\n#endif\n\nvoid main()\n{\n    {{MODULE_BEGIN_FRAG}}\n    vec4 col=color;\n\n    #ifdef HAS_TEXTURES\n        vec2 uv=texCoord;\n\n        #ifdef HAS_TEXTURE_DIFFUSE\n            col=texture(tex,uv);\n\n            #ifdef COLORIZE_TEXTURE\n                col.r*=color.r;\n                col.g*=color.g;\n                col.b*=color.b;\n            #endif\n        #endif\n        col.a*=color.a;\n        #ifdef HAS_TEXTURE_OPACITY\n            #ifdef TRANSFORMALPHATEXCOORDS\n                uv=texCoordOrig;\n            #endif\n            #ifdef ALPHA_MASK_ALPHA\n                col.a*=texture(texOpacity,uv).a;\n            #endif\n            #ifdef ALPHA_MASK_LUMI\n                col.a*=dot(vec3(0.2126,0.7152,0.0722), texture(texOpacity,uv).rgb);\n            #endif\n            #ifdef ALPHA_MASK_R\n                col.a*=texture(texOpacity,uv).r;\n            #endif\n            #ifdef ALPHA_MASK_G\n                col.a*=texture(texOpacity,uv).g;\n            #endif\n            #ifdef ALPHA_MASK_B\n                col.a*=texture(texOpacity,uv).b;\n            #endif\n            // #endif\n        #endif\n    #endif\n\n    {{MODULE_COLOR}}\n\n    #ifdef DISCARDTRANS\n        if(col.a<0.2) discard;\n    #endif\n\n    outColor = col;\n}\n",basicmaterial_vert:"IN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN vec3 attrVertNormal;\nIN float attrVertIndex;\n\n{{MODULES_HEAD}}\n\nOUT vec3 norm;\nOUT vec2 texCoord;\nOUT vec2 texCoordOrig;\n\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\n\n#ifdef HAS_TEXTURES\n    UNI float diffuseRepeatX;\n    UNI float diffuseRepeatY;\n    UNI float texOffsetX;\n    UNI float texOffsetY;\n#endif\n\nvoid main()\n{\n    mat4 mMatrix=modelMatrix;\n    mat4 mvMatrix;\n\n    norm=attrVertNormal;\n    texCoordOrig=attrTexCoord;\n    texCoord=attrTexCoord;\n    #ifdef HAS_TEXTURES\n        texCoord.x=texCoord.x*diffuseRepeatX+texOffsetX;\n        texCoord.y=(1.0-texCoord.y)*diffuseRepeatY+texOffsetY;\n    #endif\n\n    vec4 pos = vec4(vPosition, 1.0);\n\n    #ifdef BILLBOARD\n       vec3 position=vPosition;\n       mvMatrix=viewMatrix*modelMatrix;\n\n       gl_Position = projMatrix * mvMatrix * vec4((\n           position.x * vec3(\n               mvMatrix[0][0],\n               mvMatrix[1][0],\n               mvMatrix[2][0] ) +\n           position.y * vec3(\n               mvMatrix[0][1],\n               mvMatrix[1][1],\n               mvMatrix[2][1]) ), 1.0);\n    #endif\n\n    {{MODULE_VERTEX_POSITION}}\n\n    #ifndef BILLBOARD\n        mvMatrix=viewMatrix * mMatrix;\n    #endif\n\n\n    #ifndef BILLBOARD\n        // gl_Position = projMatrix * viewMatrix * modelMatrix * pos;\n        gl_Position = projMatrix * mvMatrix * pos;\n    #endif\n}\n",};
const render=op.inTrigger("render");


const trigger=op.outTrigger('trigger');
const shaderOut=op.outObject("shader");

shaderOut.ignoreValueSerialize=true;

const cgl=op.patch.cgl;

op.toWorkPortsNeedToBeLinked(render);

const shader=new CGL.Shader(cgl,"basicmaterialnew");
shader.setModules(['MODULE_VERTEX_POSITION','MODULE_COLOR','MODULE_BEGIN_FRAG']);
shader.setSource(attachments.basicmaterial_vert,attachments.basicmaterial_frag);
shaderOut.set(shader);

render.onTriggered=doRender;


// rgba colors
const r=op.inValueSlider("r",Math.random());
const g=op.inValueSlider("g",Math.random());
const b=op.inValueSlider("b",Math.random());
const a=op.inValueSlider("a",1);
r.setUiAttribs({"colorPick":true});

const uniColor=new CGL.Uniform(shader,'4f','color',r,g,b,a);

// diffuse outTexture

const diffuseTexture=op.inTexture("texture");
var diffuseTextureUniform=null;
diffuseTexture.onChange=updateDiffuseTexture;

const colorizeTexture=op.inValueBool("colorizeTexture",false);

// opacity texture
const textureOpacity=op.inTexture("textureOpacity");
var textureOpacityUniform=null;

const alphaMaskSource=op.inSwitch("Alpha Mask Source",["Luminance","R","G","B","A"],"Luminance");
alphaMaskSource.setUiAttribs({greyout:true});
textureOpacity.onChange=updateOpacity;

const texCoordAlpha=op.inValueBool("Opacity TexCoords Transform",false);
const discardTransPxl=op.inValueBool("Discard Transparent Pixels");


// texture coords

const diffuseRepeatX=op.inValue("diffuseRepeatX",1);
const diffuseRepeatY=op.inValue("diffuseRepeatY",1);
const diffuseOffsetX=op.inValue("Tex Offset X",0);
const diffuseOffsetY=op.inValue("Tex Offset Y",0);

const diffuseRepeatXUniform=new CGL.Uniform(shader,'f','diffuseRepeatX',diffuseRepeatX);
const diffuseRepeatYUniform=new CGL.Uniform(shader,'f','diffuseRepeatY',diffuseRepeatY);
const diffuseOffsetXUniform=new CGL.Uniform(shader,'f','texOffsetX',diffuseOffsetX);
const diffuseOffsetYUniform=new CGL.Uniform(shader,'f','texOffsetY',diffuseOffsetY);

const doBillboard=op.inValueBool("billboard",false);

alphaMaskSource.onChange=
    doBillboard.onChange=
    discardTransPxl.onChange=
    texCoordAlpha.onChange=
    colorizeTexture.onChange=updateDefines;


op.setPortGroup("Color",[r,g,b,a]);
op.setPortGroup("Color Texture",[diffuseTexture,colorizeTexture]);
op.setPortGroup("Opacity",[textureOpacity,alphaMaskSource,discardTransPxl,texCoordAlpha]);
op.setPortGroup("Texture Transform",[diffuseRepeatX,diffuseRepeatY,diffuseOffsetX,diffuseOffsetY]);


updateOpacity();
updateDiffuseTexture();



op.preRender=function()
{
    shader.bind();
    doRender();
};

function doRender()
{
    if(!shader)return;

    cgl.pushShader(shader);
    shader.popTextures();

    if(diffuseTextureUniform && diffuseTexture.get()) shader.pushTexture(diffuseTextureUniform,diffuseTexture.get().tex);
    if(textureOpacityUniform && textureOpacity.get()) shader.pushTexture(textureOpacityUniform,textureOpacity.get().tex);
    trigger.trigger();

    cgl.popShader();
}

function updateOpacity()
{
    if(textureOpacity.get())
    {
        if(textureOpacityUniform!==null)return;
        shader.removeUniform('texOpacity');
        shader.define('HAS_TEXTURE_OPACITY');
        if(!textureOpacityUniform)textureOpacityUniform=new CGL.Uniform(shader,'t','texOpacity',1);

        alphaMaskSource.setUiAttribs({greyout:false});
        // discardTransPxl.setUiAttribs({greyout:false});
        texCoordAlpha.setUiAttribs({greyout:false});
    }
    else
    {
        shader.removeUniform('texOpacity');
        shader.removeDefine('HAS_TEXTURE_OPACITY');
        textureOpacityUniform=null;

        alphaMaskSource.setUiAttribs({greyout:true});
        // discardTransPxl.setUiAttribs({greyout:true});
        texCoordAlpha.setUiAttribs({greyout:true});
    }

    updateDefines();
}

function updateDiffuseTexture()
{
    if(diffuseTexture.get())
    {
        if(!shader.hasDefine('HAS_TEXTURE_DIFFUSE'))shader.define('HAS_TEXTURE_DIFFUSE');
        if(!diffuseTextureUniform)diffuseTextureUniform=new CGL.Uniform(shader,'t','texDiffuse',0);

        diffuseRepeatX.setUiAttribs({greyout:false});
        diffuseRepeatY.setUiAttribs({greyout:false});
        diffuseOffsetX.setUiAttribs({greyout:false});
        diffuseOffsetY.setUiAttribs({greyout:false});
        colorizeTexture.setUiAttribs({greyout:false});
    }
    else
    {
        shader.removeUniform('texDiffuse');
        shader.removeDefine('HAS_TEXTURE_DIFFUSE');
        diffuseTextureUniform=null;

        diffuseRepeatX.setUiAttribs({greyout:true});
        diffuseRepeatY.setUiAttribs({greyout:true});
        diffuseOffsetX.setUiAttribs({greyout:true});
        diffuseOffsetY.setUiAttribs({greyout:true});
        colorizeTexture.setUiAttribs({greyout:true});
    }
}

function updateDefines()
{
    shader.toggleDefine('COLORIZE_TEXTURE', colorizeTexture.get());
    shader.toggleDefine('TRANSFORMALPHATEXCOORDS', texCoordAlpha.get());
    shader.toggleDefine('DISCARDTRANS', discardTransPxl.get());
    shader.toggleDefine('BILLBOARD', doBillboard.get());

    shader.toggleDefine('ALPHA_MASK_ALPHA', alphaMaskSource.get()=='Alpha Channel');
    shader.toggleDefine('ALPHA_MASK_LUMI', alphaMaskSource.get()=='Luminance');
    shader.toggleDefine('ALPHA_MASK_R', alphaMaskSource.get()=='R');
    shader.toggleDefine("ALPHA_MASK_G", alphaMaskSource.get()=='G');
    shader.toggleDefine('ALPHA_MASK_B', alphaMaskSource.get()=='B');
}




};

Ops.Gl.Shader.BasicMaterial_v3.prototype = new CABLES.Op();
CABLES.OPS["ec55d252-3843-41b1-b731-0482dbd9e72b"]={f:Ops.Gl.Shader.BasicMaterial_v3,objName:"Ops.Gl.Shader.BasicMaterial_v3"};




// **************************************************************
// 
// Ops.Sequence
// 
// **************************************************************

Ops.Sequence = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const exe=op.inTrigger("exe");
const exes=[];
const triggers=[];
const num=16;
exe.onTriggered=triggerAll;

function triggerAll()
{
    for(var i=0;i<triggers.length;i++) triggers[i].trigger();
}

for(var i=0;i<num;i++)
{
    triggers.push( op.outTrigger("trigger "+i));

    if(i<num-1)
    {
        var newExe=op.inTrigger("exe "+i);
        newExe.onTriggered=triggerAll;
        exes.push( newExe );
    }
}

};

Ops.Sequence.prototype = new CABLES.Op();
CABLES.OPS["a466bc1f-06e9-4595-8849-bffb9fe22f99"]={f:Ops.Sequence,objName:"Ops.Sequence"};




// **************************************************************
// 
// Ops.Devices.Mouse.Mouse_v2
// 
// **************************************************************

Ops.Devices.Mouse.Mouse_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    active=op.inValueBool("Active",true),
    relative=op.inValueBool("relative"),
    normalize=op.inValueBool("normalize"),
    flipY=op.inValueBool("flip y",true),
    area=op.inValueSelect("Area",['Canvas','Document','Parent Element'],"Canvas"),
    rightClickPrevDef=op.inBool("right click prevent default",true),
    touchscreen=op.inValueBool("Touch support",true),
    smooth=op.inValueBool("smooth"),
    smoothSpeed=op.inValueFloat("smoothSpeed",20),
    multiply=op.inValueFloat("multiply",1),
    outMouseX=op.outValue("x"),
    outMouseY=op.outValue("y"),
    mouseDown=op.outValueBool("button down"),
    mouseClick=op.outTrigger("click"),
    mouseUp=op.outTrigger("Button Up"),
    mouseClickRight=op.outTrigger("click right"),
    mouseOver=op.outValueBool("mouseOver"),
    outButton=op.outValue("button");

op.setPortGroup('Behavior',[relative,normalize,flipY,area,rightClickPrevDef,touchscreen]);
op.setPortGroup('Smoothing',[smooth,smoothSpeed,multiply]);

var smoothTimer=0;
var cgl=op.patch.cgl;
var listenerElement=null;

function setValue(x,y)
{
    if(normalize.get())
    {
        var w=cgl.canvas.width/cgl.pixelDensity;
        var h=cgl.canvas.height/cgl.pixelDensity;
        if(listenerElement==document.body)
        {
            w=listenerElement.clientWidth/cgl.pixelDensity;
            h=listenerElement.clientHeight/cgl.pixelDensity;
        }
        outMouseX.set( (x/w*2.0-1.0)*multiply.get() );
        outMouseY.set( (y/h*2.0-1.0)*multiply.get() );
    }
    else
    {
        outMouseX.set( x*multiply.get() );
        outMouseY.set( y*multiply.get() );
    }
}

smooth.onChange=function()
{
    if(smooth.get()) smoothTimer = setInterval(updateSmooth, 5);
        else if(smoothTimer)clearTimeout(smoothTimer);
};

var smoothX,smoothY;
var lineX=0,lineY=0;

normalize.onChange=function()
{
    mouseX=0;
    mouseY=0;
    setValue(mouseX,mouseY);
};

var mouseX=cgl.canvas.width/2;
var mouseY=cgl.canvas.height/2;

lineX=mouseX;
lineY=mouseY;

outMouseX.set(mouseX);
outMouseY.set(mouseY);

var relLastX=0;
var relLastY=0;
var offsetX=0;
var offsetY=0;
addListeners();

area.onChange=addListeners;

var speed=0;

function updateSmooth()
{
    speed=smoothSpeed.get();
    if(speed<=0)speed=0.01;
    var distanceX = Math.abs(mouseX - lineX);
    var speedX = Math.round( distanceX / speed, 0 );
    lineX = (lineX < mouseX) ? lineX + speedX : lineX - speedX;

    var distanceY = Math.abs(mouseY - lineY);
    var speedY = Math.round( distanceY / speed, 0 );
    lineY = (lineY < mouseY) ? lineY + speedY : lineY - speedY;

    setValue(lineX,lineY);
}

function onMouseEnter(e)
{
    mouseDown.set(false);
    mouseOver.set(true);
    speed=smoothSpeed.get();
}

function onMouseDown(e)
{
    outButton.set(e.which);
    mouseDown.set(true);
}

function onMouseUp(e)
{
    outButton.set(0);
    mouseDown.set(false);
    mouseUp.trigger();
}

function onClickRight(e)
{
    mouseClickRight.trigger();
    if(rightClickPrevDef.get()) e.preventDefault();
}

function onmouseclick(e)
{
    mouseClick.trigger();
}


function onMouseLeave(e)
{
    relLastX=0;
    relLastY=0;

    speed=100;

    //disabled for now as it makes no sense that the mouse bounces back to the center
    // if(area.get()!='Document')
    // {
    //     // leave anim
    //     if(smooth.get())
    //     {
    //         mouseX=cgl.canvas.width/2;
    //         mouseY=cgl.canvas.height/2;
    //     }

    // }
    mouseOver.set(false);
    mouseDown.set(false);
}

relative.onChange=function()
{
    offsetX=0;
    offsetY=0;
}

function onmousemove(e)
{
    mouseOver.set(true);

    if(!relative.get())
    {
        if(area.get()!="Document")
        {
            offsetX=e.offsetX;
            offsetY=e.offsetY;
        }
        else
        {
            offsetX=e.clientX;
            offsetY=e.clientY;
        }

        if(smooth.get())
        {
            mouseX=offsetX;

            if(flipY.get()) mouseY=listenerElement.clientHeight-offsetY;
                else mouseY=offsetY;
        }
        else
        {
            if(flipY.get()) setValue(offsetX,listenerElement.clientHeight-offsetY);
                else setValue(offsetX,offsetY);
        }
    }
    else
    {
        if(relLastX!=0 && relLastY!=0)
        {
            offsetX=e.offsetX-relLastX;
            offsetY=e.offsetY-relLastY;
        }
        else
        {

        }

        relLastX=e.offsetX;
        relLastY=e.offsetY;

        mouseX+=offsetX;
        mouseY+=offsetY;

        if(mouseY>460)mouseY=460;
    }
};

function ontouchstart(event)
{
    mouseDown.set(true);

    if(event.touches && event.touches.length>0) onMouseDown(event.touches[0]);
}

function ontouchend(event)
{
    mouseDown.set(false);
    onMouseUp();
}

touchscreen.onChange=function()
{
    removeListeners();
    addListeners();
}

function removeListeners()
{
    listenerElement.removeEventListener('touchend', ontouchend);
    listenerElement.removeEventListener('touchstart', ontouchstart);

    listenerElement.removeEventListener('click', onmouseclick);
    listenerElement.removeEventListener('mousemove', onmousemove);
    listenerElement.removeEventListener('mouseleave', onMouseLeave);
    listenerElement.removeEventListener('mousedown', onMouseDown);
    listenerElement.removeEventListener('mouseup', onMouseUp);
    listenerElement.removeEventListener('mouseenter', onMouseEnter);
    listenerElement.removeEventListener('contextmenu', onClickRight);
    listenerElement=null;
}

function addListeners()
{
    if(listenerElement)removeListeners();

    listenerElement=cgl.canvas;
    if(area.get()=='Document') listenerElement=document.body;
    if(area.get()=='Parent Element') listenerElement=cgl.canvas.parentElement;

    if(touchscreen.get())
    {
        listenerElement.addEventListener('touchend', ontouchend);
        listenerElement.addEventListener('touchstart', ontouchstart);
    }

    listenerElement.addEventListener('click', onmouseclick);
    listenerElement.addEventListener('mousemove', onmousemove);
    listenerElement.addEventListener('mouseleave', onMouseLeave);
    listenerElement.addEventListener('mousedown', onMouseDown);
    listenerElement.addEventListener('mouseup', onMouseUp);
    listenerElement.addEventListener('mouseenter', onMouseEnter);
    listenerElement.addEventListener('contextmenu', onClickRight);
}

active.onChange=function()
{
    if(listenerElement)removeListeners();
    if(active.get())addListeners();
}

op.onDelete=function()
{
    removeListeners();
};

addListeners();


};

Ops.Devices.Mouse.Mouse_v2.prototype = new CABLES.Op();
CABLES.OPS["9fa3fc46-3147-4e3a-8ee8-a93ea9e8786e"]={f:Ops.Devices.Mouse.Mouse_v2,objName:"Ops.Devices.Mouse.Mouse_v2"};




// **************************************************************
// 
// Ops.Gl.CanvasInfo
// 
// **************************************************************

Ops.Gl.CanvasInfo = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};


const
    width=op.outValue("width"),
    height=op.outValue("height"),
    pixelRatio=op.outValue("Pixel Ratio"),
    aspect=op.outValue("Aspect Ratio"),
    landscape=op.outValueBool("Landscape");

var cgl=op.patch.cgl;
cgl.addEventListener("resize",update);
update();

function update()
{
    height.set(cgl.canvasHeight);
    width.set(cgl.canvasWidth);
    pixelRatio.set(window.devicePixelRatio);
    aspect.set(cgl.canvasWidth/cgl.canvasHeight);
    landscape.set(cgl.canvasWidth>cgl.canvasHeight);
}


};

Ops.Gl.CanvasInfo.prototype = new CABLES.Op();
CABLES.OPS["94e499e5-b4ee-4861-ab48-6ab5098b2cc3"]={f:Ops.Gl.CanvasInfo,objName:"Ops.Gl.CanvasInfo"};




// **************************************************************
// 
// Ops.Math.Divide
// 
// **************************************************************

Ops.Math.Divide = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    number1 = op.inValueFloat("number1",1),
    number2 = op.inValueFloat("number2",2),
    result = op.outValue("result");

number1.onChange=number2.onChange=exec;
exec();

function exec()
{
    result.set( number1.get() / number2.get() );
}



};

Ops.Math.Divide.prototype = new CABLES.Op();
CABLES.OPS["86fcfd8c-038d-4b91-9820-a08114f6b7eb"]={f:Ops.Math.Divide,objName:"Ops.Math.Divide"};




// **************************************************************
// 
// Ops.Math.Multiply
// 
// **************************************************************

Ops.Math.Multiply = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const number1=op.inValueFloat("number1");
const number2=op.inValueFloat("number2");
const result=op.outValue("result");

number1.set(1);
number2.set(2);

number1.onChange=update;
number2.onChange=update;
update();

function update()
{
    const n1=number1.get();
    const n2=number2.get();

    // if(isNaN(n1))n1=0;
    // if(isNaN(n2))n2=0;

    result.set( n1*n2 );
}



};

Ops.Math.Multiply.prototype = new CABLES.Op();
CABLES.OPS["1bbdae06-fbb2-489b-9bcc-36c9d65bd441"]={f:Ops.Math.Multiply,objName:"Ops.Math.Multiply"};




// **************************************************************
// 
// Ops.Ui.Comment_v2
// 
// **************************************************************

Ops.Ui.Comment_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inTitle=op.inString("title",'New comment'),
    inText=op.inTextarea("text")
    ;

op.init=
    inTitle.onChange=
    inText.onChange=
    op.onLoaded=update;

update();

function update()
{
    if(CABLES.UI)
    {
        op.uiAttr(
            {
                'comment_title':inTitle.get(),
                'comment_text':inText.get()
            });

        op.name=inTitle.get();
    }
}




};

Ops.Ui.Comment_v2.prototype = new CABLES.Op();
CABLES.OPS["93492eeb-bf35-4a62-98f7-d85b0b79bfe5"]={f:Ops.Ui.Comment_v2,objName:"Ops.Ui.Comment_v2"};




// **************************************************************
// 
// Ops.Anim.Timer_v2
// 
// **************************************************************

Ops.Anim.Timer_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inSpeed=op.inValue("Speed",1),
    playPause=op.inValueBool("Play",true),
    reset=op.inTriggerButton("Reset"),
    inSyncTimeline=op.inValueBool("Sync to timeline",false),
    outTime=op.outValue("Time");

op.setPortGroup("Controls",[playPause,reset,inSpeed]);

const timer=new CABLES.Timer();
var lastTime=null;
var time=0;
var syncTimeline=false;

playPause.onChange=setState;
setState();

function setState()
{
    if(playPause.get())
    {
        timer.play();
        op.patch.addOnAnimFrame(op);
    }
    else
    {
        timer.pause();
        op.patch.removeOnAnimFrame(op);
    }
}

reset.onTriggered=doReset;

function doReset()
{
    time=0;
    lastTime=null;
    timer.setTime(0);
    outTime.set(0);
}

inSyncTimeline.onChange=function()
{
    syncTimeline=inSyncTimeline.get();
    playPause.setUiAttribs({greyout:syncTimeline});
    reset.setUiAttribs({greyout:syncTimeline});
};

op.onAnimFrame=function(tt)
{
    if(timer.isPlaying())
    {

        if(CABLES.overwriteTime!==undefined)
        {
            outTime.set(CABLES.overwriteTime*inSpeed.get());

        } else

        if(syncTimeline)
        {
            outTime.set(tt*inSpeed.get());
        }
        else
        {
            timer.update();
            var timerVal=timer.get();



            if(lastTime===null)
            {
                lastTime=timerVal;
                return;
            }

            var t=Math.abs(timerVal-lastTime);
            lastTime=timerVal;




            time+=t*inSpeed.get();
            if(time!=time)time=0;
            outTime.set(time);
        }
    }
};




};

Ops.Anim.Timer_v2.prototype = new CABLES.Op();
CABLES.OPS["aac7f721-208f-411a-adb3-79adae2e471a"]={f:Ops.Anim.Timer_v2,objName:"Ops.Anim.Timer_v2"};




// **************************************************************
// 
// Ops.Devices.Mouse.MouseWheel_v2
// 
// **************************************************************

Ops.Devices.Mouse.MouseWheel_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    speed=op.inValue("Speed",1),
    preventScroll=op.inValueBool("prevent scroll",true),
    flip=op.inValueBool("Flip Direction"),
    area=op.inSwitch("Area",['Canvas','Document'],'Canvas'),
    active=op.inValueBool("active",true),

    delta=op.outValue("delta",0),
    deltaX=op.outValue("delta X",0),
    deltaOrig=op.outValue("browser event delta",0);

const cgl=op.patch.cgl;
var value=0;

var startTime=CABLES.now()/1000.0;
var v=0;


var dir=1;

var listenerElement=null;

area.onChange=updateArea;
var vOut=0;

addListener();


var isChromium = window.chrome,
    winNav = window.navigator,
    vendorName = winNav.vendor,
    isOpera = winNav.userAgent.indexOf("OPR") > -1,
    isIEedge = winNav.userAgent.indexOf("Edge") > -1,
    isIOSChrome = winNav.userAgent.match("CriOS");

const isWindows= window.navigator.userAgent.indexOf("Windows") != -1;
const isLinux= window.navigator.userAgent.indexOf("Linux") != -1;
const isMac= window.navigator.userAgent.indexOf("Mac") != -1;

const isChrome= (isChromium !== null && isChromium !== undefined && vendorName === "Google Inc." && isOpera === false && isIEedge === false);
const isFirefox=navigator.userAgent.search("Firefox")>1;



flip.onChange=function()
{
    if(flip.get())dir=-1;
        else dir=1;
};


function normalizeWheel(event)
{
    var sY = 0;

    if ('detail' in event) { sY = event.detail; }

    if ('deltaY' in event) {
        sY=event.deltaY;
        if(event.deltaY>20)sY = 20;
        else if(event.deltaY<-20)sY = -20;
    }
    return sY;
}

function normalizeWheelX(event)
{
    var sX = 0;

    if ('deltaX' in event) {
        sX=event.deltaX;
        if(event.deltaX>20)sX = 20;
        else if(event.deltaX<-20)sX = -20;
    }
    return sX;
}

var lastEvent=0;

function onMouseWheel(e)
{
    if(Date.now()-lastEvent<10)return;
    lastEvent=Date.now();

    deltaOrig.set(e.wheelDelta || e.deltaY);

    if(e.deltaY)
    {
        var d=normalizeWheel(e);
        d*=0.01*speed.get();

        delta.set(0);
        delta.set(d);
    }

    if(e.deltaX)
    {
        var dX=normalizeWheelX(e);
        dX*=0.01*speed.get();

        deltaX.set(0);
        deltaX.set(dX);
    }

    if(preventScroll.get()) e.preventDefault();
}

function updateArea()
{
    removeListener();

    if(area.get()=='Document') listenerElement = document;
    else listenerElement = cgl.canvas;

    if(active.get())addListener();
}

function addListener()
{
    if(!listenerElement)updateArea();
    listenerElement.addEventListener('wheel', onMouseWheel);
}

function removeListener()
{
    if(listenerElement) listenerElement.removeEventListener('wheel', onMouseWheel);
}

active.onChange=function()
{
    updateArea();
}



};

Ops.Devices.Mouse.MouseWheel_v2.prototype = new CABLES.Op();
CABLES.OPS["7b9626db-536b-4bb4-85c3-95401bc60d1b"]={f:Ops.Devices.Mouse.MouseWheel_v2,objName:"Ops.Devices.Mouse.MouseWheel_v2"};




// **************************************************************
// 
// Ops.Math.DeltaSum
// 
// **************************************************************

Ops.Math.DeltaSum = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inVal=op.inValue("Delta Value"),
    defVal=op.inValue("Default Value",0),
    inReset=op.inTriggerButton("Reset"),
    inLimit=op.inValueBool("Limit",false),
    inMin=op.inValue("Min",0),
    inMax=op.inValue("Max",100),
    inMul=op.inValue("Multiply",1);

inVal.changeAlways=true;

var value=0;
var outVal=op.outValue("Absolute Value");
inLimit.onChange=updateLimit;
updateLimit();

function resetValue()
{
    var v=defVal.get();

    if(inLimit.get())
    {
        v=Math.max(inMin.get(),v);
        v=Math.min(inMax.get(),v);
    }

    value=v;
    outVal.set(value);

}

defVal.onChange=resetValue;
inReset.onTriggered=resetValue;

function updateLimit()
{
    if(!inLimit.get())
    {
        inMin.setUiAttribs({greyout:true});
        inMax.setUiAttribs({greyout:true});
    }
    else
    {
        inMin.setUiAttribs({greyout:false});
        inMax.setUiAttribs({greyout:false});
    }
}


inVal.onChange=function()
{
    value+=inVal.get()*inMul.get();

    if(inLimit.get())
    {
        if(value<inMin.get())value=inMin.get();
        if(value>inMax.get())value=inMax.get();
    }

    outVal.set(value);
};


};

Ops.Math.DeltaSum.prototype = new CABLES.Op();
CABLES.OPS["d9d4b3db-c24b-48da-b798-9e6230d861f7"]={f:Ops.Math.DeltaSum,objName:"Ops.Math.DeltaSum"};




// **************************************************************
// 
// Ops.Math.MapRange
// 
// **************************************************************

Ops.Math.MapRange = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};

const result=op.outValue("result");
var v=op.inValueFloat("value");
var old_min=op.inValueFloat("old min");
var old_max=op.inValueFloat("old max");
var new_min=op.inValueFloat("new min");
var new_max=op.inValueFloat("new max");
var easing=op.inValueSelect("Easing",["Linear","Smoothstep","Smootherstep"],"Linear");

op.setPortGroup("Input Range",[old_min,old_max]);
op.setPortGroup("Output Range",[new_min,new_max]);

var ease=0;
var r=0;

easing.onChange=function()
{
    if(easing.get()=="Smoothstep") ease=1;
        else if(easing.get()=="Smootherstep") ease=2;
            else ease=0;
};


function exec()
{
    if(v.get()>=Math.max( old_max.get(),old_min.get() ))
    {
        result.set(new_max.get());
        return;
    }
    else
    if(v.get()<=Math.min( old_max.get(),old_min.get() ))
    {
        result.set(new_min.get());
        return;
    }

    var nMin=new_min.get();
    var nMax=new_max.get();
    var oMin=old_min.get();
    var oMax=old_max.get();
    var x=v.get();

    var reverseInput = false;
    var oldMin = Math.min( oMin, oMax );
    var oldMax = Math.max( oMin, oMax );
    if(oldMin!= oMin) reverseInput = true;

    var reverseOutput = false;
    var newMin = Math.min( nMin, nMax );
    var newMax = Math.max( nMin, nMax );
    if(newMin != nMin) reverseOutput = true;

    var portion=0;

    if(reverseInput) portion = (oldMax-x)*(newMax-newMin)/(oldMax-oldMin);
        else portion = (x-oldMin)*(newMax-newMin)/(oldMax-oldMin);

    if(reverseOutput) r=newMax - portion;
        else r=portion + newMin;

    if(ease===0)
    {
        result.set(r);
    }
    else
    if(ease==1)
    {
        x = Math.max(0, Math.min(1, (r-nMin)/(nMax-nMin)));
        result.set( nMin+x*x*(3 - 2*x)* (nMax-nMin) ); // smoothstep
    }
    else
    if(ease==2)
    {
        x = Math.max(0, Math.min(1, (r-nMin)/(nMax-nMin)));
        result.set( nMin+x*x*x*(x*(x*6 - 15) + 10) * (nMax-nMin) ) ; // smootherstep
    }

}

v.set(0);
old_min.set(0);
old_max.set(1);
new_min.set(-1);
new_max.set(1);


v.onChange=exec;
old_min.onChange=exec;
old_max.onChange=exec;
new_min.onChange=exec;
new_max.onChange=exec;

result.set(0);

exec();

};

Ops.Math.MapRange.prototype = new CABLES.Op();
CABLES.OPS["2617b407-60a0-4ff6-b4a7-18136cfa7817"]={f:Ops.Math.MapRange,objName:"Ops.Math.MapRange"};




// **************************************************************
// 
// Ops.Gl.Shader.PickingMaterial
// 
// **************************************************************

Ops.Gl.Shader.PickingMaterial = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var cgl=op.patch.cgl;

var render=op.inTrigger('render');
var next=op.outTrigger("trigger")

var isPicked=op.addOutPort(new CABLES.Port(op,"is picked",CABLES.OP_PORT_TYPE_VALUE));

var pickedTrigger=op.outTrigger("On Picked");

var doBillboard=op.addInPort(new CABLES.Port(op,"billboard",CABLES.OP_PORT_TYPE_VALUE,{ display:'bool' }));
doBillboard.set(false);

doBillboard.onChange=function()
{
    if(doBillboard.get()) shader.define('BILLBOARD');
        else shader.removeDefine('BILLBOARD');
};

var cursor=op.addInPort(new CABLES.Port(op,"cursor",CABLES.OP_PORT_TYPE_VALUE,{display:'dropdown',values:["","pointer","auto","default","crosshair","move","n-resize","ne-resize","e-resize","se-resize","s-resize","sw-resize","w-resize","nw-resize","text","wait","help"]} ));
cursor.set('pointer');

function doRender()
{
    cgl.frameStore.pickingpassNum+=2;
    var currentPickingColor=cgl.frameStore.pickingpassNum;

    if(cgl.frameStore.pickingpass)
    {
        // isPicked.set(false);

        pickColorUniformR.setValue(currentPickingColor/255);
        cgl.pushShader(shader);
        next.trigger();
        cgl.popShader();
    }
    else
    {
        isPicked.set( cgl.frameStore.pickedColor==currentPickingColor );

        if(cgl.frameStore.pickedColor==currentPickingColor)
        {
            if(cursor.get().length>0 && cgl.canvas.style.cursor!=cursor.get())
            {
                cgl.canvas.style.cursor=cursor.get();
            }
            pickedTrigger.trigger();
        }
        else
        {
        }

        //console.log(cgl.frameStore.pickedColor,currentPickingColor);

        next.trigger();
    }
}

var srcVert=''
    .endl()+'IN vec3 vPosition;'
    .endl()+'UNI mat4 projMatrix;'
    .endl()+'UNI mat4 mvMatrix;'

    .endl()+'void main()'
    .endl()+'{'
    .endl()+'   #ifdef BILLBOARD'
    .endl()+'       vec3 position=vPosition;'
    .endl()+"       gl_Position = projMatrix * mvMatrix * vec4(( "
    .endl()+"           position.x * vec3("
    .endl()+"               mvMatrix[0][0],"
    .endl()+"               mvMatrix[1][0], "
    .endl()+"               mvMatrix[2][0] ) +"
    .endl()+"           position.y * vec3("
    .endl()+"               mvMatrix[0][1],"
    .endl()+"               mvMatrix[1][1], "
    .endl()+"               mvMatrix[2][1]) ), 1.0);"
    .endl()+"   #endif "

    .endl()+"   #ifndef BILLBOARD"
    .endl()+"       gl_Position = projMatrix * mvMatrix * vec4(vPosition,  1.0);"
    .endl()+"   #endif"

    .endl()+"}";

var srcFrag=''

    .endl()+'UNI float r;'
    .endl()+''
    .endl()+'void main()'
    .endl()+'{'
    .endl()+'   outColor= vec4(r,1.0,0.0,1.0);'
    .endl()+'}';

var shader=new CGL.Shader(cgl,"PickingMaterial");
shader.offScreenPass=true;
shader.setSource(srcVert,srcFrag);



var pickColorUniformR=new CGL.Uniform(shader,'f','r',0);

render.onTriggered=doRender;
doRender();

};

Ops.Gl.Shader.PickingMaterial.prototype = new CABLES.Op();
CABLES.OPS["2b58daad-4dde-4edb-af22-03ac55ab06ab"]={f:Ops.Gl.Shader.PickingMaterial,objName:"Ops.Gl.Shader.PickingMaterial"};




// **************************************************************
// 
// Ops.Boolean.IfTrueThen_v2
// 
// **************************************************************

Ops.Boolean.IfTrueThen_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe=op.inTrigger("exe"),
    boolean=op.inValueBool("boolean",false),
    triggerThen=op.outTrigger("then"),
    triggerElse=op.outTrigger("else");

exe.onTriggered=exec;

function exec()
{
    if(boolean.get()) triggerThen.trigger();
    else triggerElse.trigger();
}



};

Ops.Boolean.IfTrueThen_v2.prototype = new CABLES.Op();
CABLES.OPS["9549e2ed-a544-4d33-a672-05c7854ccf5d"]={f:Ops.Boolean.IfTrueThen_v2,objName:"Ops.Boolean.IfTrueThen_v2"};




// **************************************************************
// 
// Ops.Gl.Shader.Picker
// 
// **************************************************************

Ops.Gl.Shader.Picker = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
op.render=op.inTrigger("render");

const useMouseCoords=op.inValueBool("Use Mouse Coordinates",true);

op.x=op.inValueFloat("x");
op.y=op.inValueFloat("y");
op.enabled=op.inValueBool("enabled");
op.enabled.set(true);

op.trigger=op.outTrigger("trigger");
var somethingPicked=op.outValue("Something Picked");

var cursor=this.inValueSelect("cursor",["","pointer","auto","default","crosshair","move","n-resize","ne-resize","e-resize","se-resize","s-resize","sw-resize","w-resize","nw-resize","text","wait","help"]);

//inValueSelect
cursor.set('default');

var pixelRGB = new Uint8Array(4);
var fb=null;
var cgl=op.patch.cgl;
var lastReadPixel=0;
var canceledTouch=false;
if(cgl.glVersion==1) fb=new CGL.Framebuffer(cgl,4,4);
else
{
    // console.log("new framebuffer...");
    fb=new CGL.Framebuffer2(cgl,4,4,{multisampling:false});
}

var tex=op.outTexture("pick texture");
tex.set( fb.getTextureColor() );
useMouseCoords.onChange=updateListeners;
updateListeners();

function renderPickingPass()
{
    cgl.frameStore.renderOffscreen=true;
    cgl.frameStore.pickingpass=true;
    cgl.frameStore.pickingpassNum=0;
    op.trigger.trigger();
    cgl.frameStore.pickingpass=false;
    cgl.frameStore.renderOffscreen=false;
}

function mouseMove(e)
{

    if(e && e.hasOwnProperty('offsetX')>=0)
    {
        op.x.set(e.offsetX*(window.devicePixelRatio||1));
        op.y.set(e.offsetY*(window.devicePixelRatio||1));
    }
}

function updateListeners()
{
    cgl.canvas.removeEventListener('mouseleave', mouseleave);
    cgl.canvas.removeEventListener('mousemove', mouseMove);
    cgl.canvas.removeEventListener('touchmove', ontouchmove);
    cgl.canvas.removeEventListener('touchstart', ontouchstart);
    cgl.canvas.removeEventListener('touchend', ontouchend);
    cgl.canvas.removeEventListener('touchcancel', ontouchend);


    if(useMouseCoords.get())
    {
        cgl.canvas.addEventListener('mouseleave', mouseleave);
        cgl.canvas.addEventListener('mousemove', mouseMove);
        cgl.canvas.addEventListener('touchmove', ontouchmove);
        cgl.canvas.addEventListener('touchstart', ontouchstart);
        cgl.canvas.addEventListener('touchend', ontouchend);
        cgl.canvas.addEventListener('touchcancel', ontouchend);

    }
}

function fixTouchEvent(touchEvent)
{
    if(touchEvent)
    {
        touchEvent.offsetX = touchEvent.pageX - touchEvent.target.offsetLeft;
        touchEvent.offsetY = touchEvent.pageY - touchEvent.target.offsetTop;

        if(! /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) )
        {
            touchEvent.offsetX*=(window.devicePixelRatio||1);
            touchEvent.offsetY*=(window.devicePixelRatio||1);
        }

        return touchEvent;
    }
}

function ontouchstart(event)
{
    canceledTouch=false;
    // console.log("touch START");
    if(event.touches && event.touches.length>0)
    {
        ontouchmove(event);
        // mouseMove(fixTouchEvent(event.touches[0]));
    }
}

function mouseleave(event)
{
    op.x.set(-1000);
    op.y.set(-1000);
}

function ontouchend(event)
{
    canceledTouch=true;
    op.x.set(-1000);
    op.y.set(-1000);
    // console.log("touch END");
}

function ontouchmove(event)
{
    // console.log("touchmove");

    if(event.touches && event.touches.length>0)
    {
        mouseMove(fixTouchEvent(event.touches[0]));
    }
}


var doRender=function()
{
    if(cursor.get()!=cgl.canvas.style.cursor)
    {
        cgl.canvas.style.cursor=cursor.get();
    }

    if(op.enabled.get() && op.x.get()>=0 && !canceledTouch)
    {
        if(CABLES.now()-lastReadPixel>=50)
        {
            // console.log(op.x.get());

            var minimizeFB=2;
            cgl.resetViewPort();

            var vpW=Math.floor(cgl.canvasWidth/minimizeFB);
            var vpH=Math.floor(cgl.canvasHeight/minimizeFB);

            if(vpW!=fb.getWidth() || vpH!=fb.getHeight() )
            {
                tex.set( null);
                fb.setSize( vpW,vpH );
                tex.set( fb.getTextureColor() );
            }

            cgl.pushModelMatrix();
            fb.renderStart();
            // cgl.gl.clear(cgl.gl.DEPTH_BUFFER_BIT | cgl.gl.COLOR_BUFFER_BIT);

            renderPickingPass();

            var x=Math.floor(op.x.get()/minimizeFB/window.devicePixelRatio);
            var y=Math.floor( vpH-op.y.get()/minimizeFB/window.devicePixelRatio);
            if(x<0)x=0;
            if(y<0)y=0;

            // console.log('',x,y,vpW,vpH);
            // if(CABLES.now()-lastReadPixel>=50)
            {
                cgl.gl.readPixels(x,y, 1,1,  cgl.gl.RGBA, cgl.gl.UNSIGNED_BYTE ,pixelRGB);
                lastReadPixel=CABLES.now();
            }
            // cgl.gl.readPixels(op.x.get(), op.y.get(), 1,1,  cgl.gl.RGBA, cgl.gl.UNSIGNED_BYTE ,pixelRGB);

            fb.renderEnd();
            cgl.popModelMatrix();
            //   console.log(cgl.getViewPort()[2],cgl.getViewPort()[3],op.x.get(), op.y.get(),pixelRGB[0]);

            // cgl.gl.enable(cgl.gl.SCISSOR_TEST);
        }

        // cgl.gl.clear(cgl.gl.DEPTH_BUFFER_BIT | cgl.gl.COLOR_BUFFER_BIT);

        cgl.frameStore.pickedColor=pixelRGB[0];
        // console.log(cgl.frameStore.pickedColor);

        if(cgl.frameStore.pickedColor)somethingPicked.set(true);
            else somethingPicked.set(false);

        cgl.frameStore.pickingpassNum=0;
        op.trigger.trigger();
    }
    else
    {
        cgl.frameStore.pickedColor=-1000;
        op.trigger.trigger();
        somethingPicked.set(false);
    }

};

function preview()
{
    render();
    tex.val.preview();
}

tex.onPreviewChanged=function()
{
    if(tex.showPreview) op.render.onTriggered=doRender;
    else op.render.onTriggered=doRender;
};

op.render.onTriggered=doRender;


};

Ops.Gl.Shader.Picker.prototype = new CABLES.Op();
CABLES.OPS["09122fbf-3b6b-4a05-ac76-fca031b505b9"]={f:Ops.Gl.Shader.Picker,objName:"Ops.Gl.Shader.Picker"};




// **************************************************************
// 
// Ops.Html.FullscreenMode
// 
// **************************************************************

Ops.Html.FullscreenMode = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    doRequest=op.inTriggerButton("Request Fullscreen"),
    doExit=op.inTriggerButton("Exit Fullscreen"),
    isFullscreen=op.outValueBool("Is Fullscreen");

doExit.onTriggered=exitFs;
doRequest.onTriggered=startFs;


var countStarts=0;

function setState()
{
    var isFull=(!window.screenTop && !window.screenY);
    isFullscreen.set(isFull);
}

function startFs()
{
    countStarts++;
    if(countStarts>30)
    {
        doRequest.onTriggered=null;
        op.setUiAttrib({error:"Fullscreen Request shound not triggered that often: op disabled"});
        exitFs();
    }
    var elem=op.patch.cgl.canvas.parentElement;

    if (elem.requestFullScreen) elem.requestFullScreen();
    else if (elem.mozRequestFullScreen) elem.mozRequestFullScreen();
    else if (elem.webkitRequestFullScreen)elem.webkitRequestFullScreen();
    else if (elem.msRequestFullScreen)elem.msRequestFullScreen();

    setTimeout(setState,100);
    setTimeout(setState,500);
    setTimeout(setState,1000);
}



function exitFs()
{

    countStarts--;
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.msExitFullscreen)document.msExitFullscreen();

    setTimeout(setState,100);
    setTimeout(setState,500);
    setTimeout(setState,1000);
}

};

Ops.Html.FullscreenMode.prototype = new CABLES.Op();
CABLES.OPS["fe933b35-696d-4738-be03-c0c011ed67a0"]={f:Ops.Html.FullscreenMode,objName:"Ops.Html.FullscreenMode"};




// **************************************************************
// 
// Ops.Html.HyperLink_v2
// 
// **************************************************************

Ops.Html.HyperLink_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exec=op.inTrigger("Open"),
    inUrl=op.inString("URL","https://cables.gl"),
    inTarget=op.inString("Target Name","_self"),
    inSpecs=op.inString("Specs","");


exec.onTriggered=function()
{
    // document.location.href=inUrl.get();
    window.open(inUrl.get(), inTarget.get(), inSpecs.get());
};

};

Ops.Html.HyperLink_v2.prototype = new CABLES.Op();
CABLES.OPS["a669d4f7-1e35-463c-bf8b-08c9f1b68e04"]={f:Ops.Html.HyperLink_v2,objName:"Ops.Html.HyperLink_v2"};




// **************************************************************
// 
// Ops.Devices.Mouse.MouseButtons
// 
// **************************************************************

Ops.Devices.Mouse.MouseButtons = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    mouseClickLeft=op.outTrigger("Click Left"),
    mouseClickRight=op.outTrigger("Click Right"),
    mouseDoubleClick=op.outTrigger("Double Click"),
    mouseDownLeft=op.outValue("Button pressed Left",false),
    mouseDownMiddle=op.outValue("Button pressed Middle",false),
    mouseDownRight=op.outValue("Button pressed Right",false),
    triggerMouseDownLeft=op.outTrigger("Mouse Down Left"),
    triggerMouseDownMiddle=op.outTrigger("Mouse Down Middle"),
    triggerMouseDownRight=op.outTrigger("Mouse Down Right"),
    triggerMouseUpLeft=op.outTrigger("Mouse Up Left"),
    triggerMouseUpMiddle=op.outTrigger("Mouse Up Middle"),
    triggerMouseUpRight=op.outTrigger("Mouse Up Right"),
    area=op.inValueSelect("Area",['Canvas','Document'],'Canvas'),
    active=op.inValueBool("Active",true);

const cgl=op.patch.cgl;
var listenerElement=null;
area.onChange=addListeners;
op.onDelete=removeListeners;
addListeners();
var mouseDownTime=0;

function onMouseDown(e)
{
    mouseDownTime=CABLES.now();
    if(e.which==1)
    {
        mouseDownLeft.set(true);
        triggerMouseDownLeft.trigger();
    }
    else if(e.which==2)
    {
        mouseDownMiddle.set(true);
        triggerMouseDownMiddle.trigger();
    }
    else if(e.which==3)
    {
        mouseDownRight.set(true);
        triggerMouseDownRight.trigger();
    }
}

function onMouseUp(e)
{
    if(e.which==1)
    {
        mouseDownLeft.set(false);
        triggerMouseUpLeft.trigger();
    }
    else if(e.which==2)
    {
        mouseDownMiddle.set(false);
        triggerMouseUpMiddle.trigger();
    }
    else if(e.which==3)
    {
        mouseDownRight.set(false);
        triggerMouseUpRight.trigger();
    }
}

function onClickRight(e)
{
    mouseClickRight.trigger();
    e.preventDefault();
}

function onDoubleClick(e)
{
    mouseDoubleClick.trigger();
}

function onmouseclick(e)
{
    if(CABLES.now()-mouseDownTime<200)
        mouseClickLeft.trigger();
}

function ontouchstart(event)
{
    if(event.touches && event.touches.length>0)
    {
        event.touches[0].which=1;
        onMouseDown(event.touches[0]);
    }
}

function ontouchend(event)
{
    onMouseUp({which:1});
}

function removeListeners()
{
    if(!listenerElement) return;
    listenerElement.removeEventListener('touchend', ontouchend);
    listenerElement.removeEventListener('touchcancel', ontouchend);
    listenerElement.removeEventListener('touchstart', ontouchstart);
    listenerElement.removeEventListener('dblclick', onDoubleClick);
    listenerElement.removeEventListener('click', onmouseclick);
    listenerElement.removeEventListener('mousedown', onMouseDown);
    listenerElement.removeEventListener('mouseup', onMouseUp);
    listenerElement.removeEventListener('contextmenu', onClickRight);
    listenerElement.removeEventListener('mouseleave', onMouseUp);
    listenerElement=null;
}

function addListeners()
{
    if(listenerElement)removeListeners();

    listenerElement=cgl.canvas;
    if(area.get()=='Document') listenerElement=document.body;

    listenerElement.addEventListener('touchend', ontouchend);
    listenerElement.addEventListener('touchcancel', ontouchend);
    listenerElement.addEventListener('touchstart', ontouchstart);
    listenerElement.addEventListener('dblclick', onDoubleClick);
    listenerElement.addEventListener('click', onmouseclick);
    listenerElement.addEventListener('mousedown', onMouseDown);
    listenerElement.addEventListener('mouseup', onMouseUp);
    listenerElement.addEventListener('contextmenu', onClickRight);
    listenerElement.addEventListener('mouseleave', onMouseUp);

}

op.onLoaded=addListeners;

active.onChange=updateListeners;

function updateListeners()
{
    removeListeners();
    if(active.get()) addListeners();
}







};

Ops.Devices.Mouse.MouseButtons.prototype = new CABLES.Op();
CABLES.OPS["c7e5e545-c8a1-4fef-85c2-45422b947f0d"]={f:Ops.Devices.Mouse.MouseButtons,objName:"Ops.Devices.Mouse.MouseButtons"};




// **************************************************************
// 
// Ops.Boolean.And
// 
// **************************************************************

Ops.Boolean.And = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    bool0=op.inValueBool("bool 1"),
    bool1=op.inValueBool("bool 2"),
    result=op.outValueBool("result");

bool0.onChange=exec;
bool1.onChange=exec;

function exec()
{
    result.set( bool1.get() && bool0.get() );
}

};

Ops.Boolean.And.prototype = new CABLES.Op();
CABLES.OPS["c26e6ce0-8047-44bb-9bc8-5a4f911ed8ad"]={f:Ops.Boolean.And,objName:"Ops.Boolean.And"};




// **************************************************************
// 
// Ops.Math.Compare.LessThan
// 
// **************************************************************

Ops.Math.Compare.LessThan = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const number1 = op.inValue("number1");
const number2 = op.inValue("number2");
const result = op.outValue("result");

number1.onChange=exec;
number2.onChange=exec;
exec();

function exec()
{
    result.set( number1.get() < number2.get() );
}



};

Ops.Math.Compare.LessThan.prototype = new CABLES.Op();
CABLES.OPS["04fd113f-ade1-43fb-99fa-f8825f8814c0"]={f:Ops.Math.Compare.LessThan,objName:"Ops.Math.Compare.LessThan"};




// **************************************************************
// 
// Ops.Value.NumberSwitchBoolean
// 
// **************************************************************

Ops.Value.NumberSwitchBoolean = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inBool=op.inValueBool("Boolean"),
    valTrue=op.inValue("Value true",1),
    valFalse=op.inValue("Value false",0),
    outVal=op.outValue("Result");

inBool.onChange =
    valTrue.onChange =
    valFalse.onChange = update;

op.setPortGroup("Output Values",[valTrue,valFalse]);

function update() {
    if(inBool.get()) outVal.set(valTrue.get());
    else outVal.set(valFalse.get());
}

};

Ops.Value.NumberSwitchBoolean.prototype = new CABLES.Op();
CABLES.OPS["637c5fa8-840d-4535-96ab-3d27b458a8ba"]={f:Ops.Value.NumberSwitchBoolean,objName:"Ops.Value.NumberSwitchBoolean"};




// **************************************************************
// 
// Ops.Gl.FaceCulling
// 
// **************************************************************

Ops.Gl.FaceCulling = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    render=op.inTrigger("render"),
    trigger=op.outTrigger("trigger"),
    enable=op.inValueBool("enable",true),
    facing=op.inSwitch("facing",['back','front','both'],'back'),
    cgl=op.patch.cgl;

var whichFace=cgl.gl.BACK;

render.onTriggered=function()
{
    if(enable.get()) cgl.gl.enable(cgl.gl.CULL_FACE);
        else cgl.gl.disable(cgl.gl.CULL_FACE);

    cgl.gl.cullFace(whichFace);
    trigger.trigger();
    cgl.gl.disable(cgl.gl.CULL_FACE);
};

facing.onChange=function()
{
    whichFace=cgl.gl.BACK;
    if(facing.get()=='front') whichFace=cgl.gl.FRONT;
        else if(facing.get()=='both') whichFace=cgl.gl.FRONT_AND_BACK;
};

};

Ops.Gl.FaceCulling.prototype = new CABLES.Op();
CABLES.OPS["a389f42c-7324-45c9-bb47-369e31d602f0"]={f:Ops.Gl.FaceCulling,objName:"Ops.Gl.FaceCulling"};




// **************************************************************
// 
// Ops.Gl.Shader.BasicMaterial
// 
// **************************************************************

Ops.Gl.Shader.BasicMaterial = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={shader_frag:"{{MODULES_HEAD}}\n\nIN vec2 texCoord;\n#ifdef HAS_TEXTURES\n    IN vec2 texCoordOrig;\n    #ifdef HAS_TEXTURE_DIFFUSE\n        UNI sampler2D tex;\n    #endif\n    #ifdef HAS_TEXTURE_OPACITY\n        UNI sampler2D texOpacity;\n   #endif\n#endif\nUNI float r;\nUNI float g;\nUNI float b;\nUNI float a;\n\nvoid main()\n{\n    {{MODULE_BEGIN_FRAG}}\n    vec4 col=vec4(r,g,b,a);\n\n    #ifdef HAS_TEXTURES\n        #ifdef HAS_TEXTURE_DIFFUSE\n\n           col=texture(tex,vec2(texCoord.x,(1.0-texCoord.y)));\n\n           #ifdef COLORIZE_TEXTURE\n               col.r*=r;\n               col.g*=g;\n               col.b*=b;\n           #endif\n        #endif\n\n        col.a*=a;\n        #ifdef HAS_TEXTURE_OPACITY\n            #ifdef TRANSFORMALPHATEXCOORDS\n                col.a*=texture(texOpacity,vec2(texCoordOrig.s,1.0-texCoordOrig.t)).g;\n            #endif\n            #ifndef TRANSFORMALPHATEXCOORDS\n                col.a*=texture(texOpacity,vec2(texCoord.s,1.0-texCoord.t)).g;\n            #endif\n       #endif\n\n    #endif\n\n    {{MODULE_COLOR}}\n\n    outColor = col;\n\n\n}\n",shader_vert:"{{MODULES_HEAD}}\n\nIN vec3 vPosition;\nIN vec3 attrVertNormal;\nIN vec2 attrTexCoord;\n\nOUT vec3 norm;\nOUT vec2 texCoord;\nOUT vec2 texCoordOrig;\n\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\n\n#ifdef HAS_TEXTURES\n    #ifdef TEXTURE_REPEAT\n        UNI float diffuseRepeatX;\n        UNI float diffuseRepeatY;\n        UNI float texOffsetX;\n        UNI float texOffsetY;\n    #endif\n#endif\n\n\nvoid main()\n{\n    mat4 mMatrix=modelMatrix;\n    mat4 mvMatrix;\n\n    texCoordOrig=attrTexCoord;\n    texCoord=attrTexCoord;\n    #ifdef HAS_TEXTURES\n        #ifdef TEXTURE_REPEAT\n            texCoord.x=texCoord.x*diffuseRepeatX+texOffsetX;\n            texCoord.y=texCoord.y*diffuseRepeatY+texOffsetY;\n        #endif\n    #endif\n\n    vec4 pos = vec4( vPosition, 1. );\n\n\n    #ifdef BILLBOARD\n       vec3 position=vPosition;\n       mvMatrix=viewMatrix*modelMatrix;\n\n       gl_Position = projMatrix * mvMatrix * vec4((\n           position.x * vec3(\n               mvMatrix[0][0],\n               mvMatrix[1][0],\n               mvMatrix[2][0] ) +\n           position.y * vec3(\n               mvMatrix[0][1],\n               mvMatrix[1][1],\n               mvMatrix[2][1]) ), 1.0);\n    #endif\n\n    {{MODULE_VERTEX_POSITION}}\n\n    #ifndef BILLBOARD\n        mvMatrix=viewMatrix * mMatrix;\n    #endif\n\n\n    #ifndef BILLBOARD\n        // gl_Position = projMatrix * viewMatrix * modelMatrix * pos;\n        gl_Position = projMatrix * mvMatrix * pos;\n    #endif\n}\n",};
const render=op.inTrigger("render"),
    trigger=op.outTrigger("trigger"),
    shaderOut=op.outObject("shader");

shaderOut.ignoreValueSerialize=true;
const cgl=op.patch.cgl;

var shader=new CGL.Shader(cgl,'BasicMaterial');
shader.setModules(['MODULE_VERTEX_POSITION','MODULE_COLOR','MODULE_BEGIN_FRAG']);
shader.bindTextures=bindTextures;
shader.setSource(attachments.shader_vert,attachments.shader_frag);
shaderOut.set(shader);

render.onTriggered=doRender;

var textureOpacity=null;
var textureOpacityUniform=null;


function bindTextures()
{
    if(diffuseTexture.get()) cgl.setTexture(0, diffuseTexture.get().tex);
    if(textureOpacity.get()) cgl.setTexture(1, textureOpacity.get().tex);
}

op.preRender=function()
{
    shader.bind();
    doRender();
};

function doRender()
{
    if(!shader)return;

    cgl.pushShader(shader);
    shader.bindTextures();

    trigger.trigger();

    cgl.popShader();
}


{
    // rgba colors
    const r = op.inValueSlider("r", Math.random()),
        g = op.inValueSlider("g", Math.random()),
        b = op.inValueSlider("b", Math.random()),
        a = op.inValueSlider("a",1.0);
        r.setUiAttribs({ colorPick: true });



    a.uniform=new CGL.Uniform(shader,'f','a',a);
    b.uniform=new CGL.Uniform(shader,'f','b',b);
    r.uniform=new CGL.Uniform(shader,'f','r',r);
    g.uniform=new CGL.Uniform(shader,'f','g',g);

    op.setPortGroup('Color',[r,g,b,a]);

}

{
    // diffuse outTexture


    var diffuseTexture=op.inTexture("texture");
    var diffuseTextureUniform=null;
    shader.bindTextures=bindTextures;

    diffuseTexture.onChange=function()
    {
        if(diffuseTexture.get())
        {
            // if(diffuseTextureUniform!==null)return;
            // shader.addveUniform('texDiffuse');
            if(!shader.hasDefine('HAS_TEXTURE_DIFFUSE'))shader.define('HAS_TEXTURE_DIFFUSE');
            if(!diffuseTextureUniform)diffuseTextureUniform=new CGL.Uniform(shader,'t','texDiffuse',0);
            updateTexRepeat();
        }
        else
        {
            shader.removeUniform('texDiffuse');
            shader.removeDefine('HAS_TEXTURE_DIFFUSE');
            diffuseTextureUniform=null;
        }
    };
}

{
    // opacity texture
    textureOpacity=op.inTexture("textureOpacity");

    textureOpacity.onChange=function()
    {
        if(textureOpacity.get())
        {
            if(textureOpacityUniform!==null)return;
            shader.removeUniform('texOpacity');
            shader.define('HAS_TEXTURE_OPACITY');
            if(!textureOpacityUniform)textureOpacityUniform=new CGL.Uniform(shader,'t','texOpacity',1);
        }
        else
        {
            shader.removeUniform('texOpacity');
            shader.removeDefine('HAS_TEXTURE_OPACITY');
            textureOpacityUniform=null;
        }
    };

}

op.colorizeTexture=op.inValueBool("colorizeTexture");
op.colorizeTexture.set(false);
op.colorizeTexture.onChange=function()
{
    if(op.colorizeTexture.get()) shader.define('COLORIZE_TEXTURE');
        else shader.removeDefine('COLORIZE_TEXTURE');
};

op.doBillboard=op.inValueBool("billboard");
op.doBillboard.set(false);

op.doBillboard.onChange=function()
{
    if(op.doBillboard.get()) shader.define('BILLBOARD');
        else shader.removeDefine('BILLBOARD');
};

var texCoordAlpha=op.inValueBool("Opacity TexCoords Transform",false);

texCoordAlpha.onChange=function()
{
    if(texCoordAlpha.get()) shader.define('TRANSFORMALPHATEXCOORDS');
        else shader.removeDefine('TRANSFORMALPHATEXCOORDS');

};

var preMultipliedAlpha=op.inValueBool("preMultiplied alpha");

function updateTexRepeat()
{
    if(!diffuseRepeatXUniform)
    {
        diffuseRepeatXUniform=new CGL.Uniform(shader,'f','diffuseRepeatX',diffuseRepeatX);
        diffuseRepeatYUniform=new CGL.Uniform(shader,'f','diffuseRepeatY',diffuseRepeatY);
        diffuseOffsetXUniform=new CGL.Uniform(shader,'f','texOffsetX',diffuseOffsetX);
        diffuseOffsetYUniform=new CGL.Uniform(shader,'f','texOffsetY',diffuseOffsetY);
    }

    diffuseRepeatXUniform.setValue(diffuseRepeatX.get());
    diffuseRepeatYUniform.setValue(diffuseRepeatY.get());
    diffuseOffsetXUniform.setValue(diffuseOffsetX.get());
    diffuseOffsetYUniform.setValue(diffuseOffsetY.get());
}

{
    // texture coords

    var diffuseRepeatX=op.inValueFloat("diffuseRepeatX",1);
    var diffuseRepeatY=op.inValueFloat("diffuseRepeatY",1);
    var diffuseOffsetX=op.inValueFloat("Tex Offset X");
    var diffuseOffsetY=op.inValueFloat("Tex Offset Y");

    op.setPortGroup('Transform Texture',[diffuseRepeatX,diffuseRepeatY,diffuseOffsetX,diffuseOffsetY]);

    diffuseRepeatX.onChange=updateTexRepeat;
    diffuseRepeatY.onChange=updateTexRepeat;
    diffuseOffsetY.onChange=updateTexRepeat;
    diffuseOffsetX.onChange=updateTexRepeat;

    var diffuseRepeatXUniform=null;
    var diffuseRepeatYUniform=null;
    var diffuseOffsetXUniform=null;
    var diffuseOffsetYUniform=null;

    shader.define('TEXTURE_REPEAT');

    diffuseOffsetX.set(0);
    diffuseOffsetY.set(0);
    diffuseRepeatX.set(1);
    diffuseRepeatY.set(1);
}


updateTexRepeat();


};

Ops.Gl.Shader.BasicMaterial.prototype = new CABLES.Op();
CABLES.OPS["85ae5cfa-5eca-4dd8-8b30-850ac34f7cd5"]={f:Ops.Gl.Shader.BasicMaterial,objName:"Ops.Gl.Shader.BasicMaterial"};




// **************************************************************
// 
// Ops.Gl.Textures.TextTexture
// 
// **************************************************************

Ops.Gl.Textures.TextTexture = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var text=op.addInPort(new CABLES.Port(op,"text",CABLES.OP_PORT_TYPE_VALUE,{type:'string',display:'editor'}));
var inFontSize=op.addInPort(new CABLES.Port(op,"fontSize"));
var maximize=op.addInPort(new CABLES.Port(op,"Maximize Size",CABLES.OP_PORT_TYPE_VALUE,{display:'bool'}));
var texWidth=op.addInPort(new CABLES.Port(op,"texture width"));
var texHeight=op.addInPort(new CABLES.Port(op,"texture height"));
var align=op.addInPort(new CABLES.Port(op,"align",CABLES.OP_PORT_TYPE_VALUE,{display:'dropdown',values:['left','center','right']}));
var valign=op.addInPort(new CABLES.Port(op,"vertical align",CABLES.OP_PORT_TYPE_VALUE,{display:'dropdown',values:['top','center','bottom']}));
var font=op.addInPort(new CABLES.Port(op,"font",CABLES.OP_PORT_TYPE_VALUE,{type:'string'}));
var lineDistance=op.addInPort(new CABLES.Port(op,"line distance"));
var border=op.addInPort(new CABLES.Port(op,"border"));
var doRefresh=op.inTriggerButton("Refresh");

var cachetexture=op.inValueBool("Reuse Texture",true);

// var textureOut=op.addOutPort(new CABLES.Port(op,"texture",CABLES.OP_PORT_TYPE_TEXTURE));
var textureOut=op.outTexture("texture");
var outRatio=op.addOutPort(new CABLES.Port(op,"Ratio",CABLES.OP_PORT_TYPE_VALUE));
textureOut.ignoreValueSerialize=true;

var cgl=op.patch.cgl;

doRefresh.onTriggered=refresh;

border.set(0);
texWidth.set(512);
texHeight.set(512);
lineDistance.set(1);
inFontSize.set(30);
font.set('Arial');
align.set('center');
valign.set('center');

var fontImage = document.createElement('canvas');
fontImage.id = "texturetext_"+CABLES.generateUUID();
fontImage.style.display = "none";
var body = document.getElementsByTagName("body")[0];
body.appendChild(fontImage);



var ctx = fontImage.getContext('2d');


function reSize()
{
    textureOut.get().setSize(texWidth.get(),texHeight.get());

    ctx.canvas.width=fontImage.width=texWidth.get();
    ctx.canvas.height=fontImage.height=texHeight.get();
    refresh();
}

function refresh()
{
    ctx.clearRect(0,0,fontImage.width,fontImage.height);
    ctx.fillStyle = 'white';
    var fontSize=parseFloat(inFontSize.get());
    var fontname=font.get()+'';
    if(fontname.indexOf(" ")>-1)fontname='"'+fontname+'"';
    ctx.font = fontSize+'px '+fontname+'';
    ctx.textAlign = align.get();

    if(border.get()>0)
    {
        ctx.beginPath();
        ctx.lineWidth=""+border.get();
        ctx.strokeStyle="white";
        ctx.rect(
            0,
            0,
            texWidth.get(),
            texHeight.get()
            );
        ctx.stroke();
    }

    var i=0;

    // if(text.get())
    {
        var txt=(text.get()+'').replace(/<br\/>/g, '\n');
        var txt=(text.get()+'').replace(/<br>/g, '\n');

        var strings = txt.split("\n");


        var posy=0,i=0;

        if(maximize.get())
        {
            fontSize=texWidth.get();
            var count=0;
            var maxWidth=0;
            var maxHeight=0;

            do
            {
                count++;
                if(count>300)break;
                fontSize-=10;
                ctx.font = fontSize+'px "'+font.get()+'"';
                maxWidth=0;
                maxHeight=strings.length*fontSize*1.1;
                for(i=0;i<strings.length;i++)
                {
                    maxWidth=Math.max(maxWidth,ctx.measureText(strings[i]).width);
                }
            }
            while(maxWidth>ctx.canvas.width || maxHeight>ctx.canvas.height);
        }

        if(valign.get()=='center')
        {
            var maxy=(strings.length-1.5)*fontSize+parseFloat(lineDistance.get());
            posy=ctx.canvas.height / 2-maxy/2;
        }
        else if(valign.get()=='top') posy=fontSize;
        else if(valign.get()=='bottom')  posy=ctx.canvas.height -(strings.length)*(parseFloat(inFontSize.get())+parseFloat(lineDistance.get()));

        for(i=0;i<strings.length;i++)
        {
            if(align.get()=='center') ctx.fillText(strings[i], ctx.canvas.width / 2, posy);
            if(align.get()=='left') ctx.fillText(strings[i], 0, posy);
            if(align.get()=='right') ctx.fillText(strings[i], ctx.canvas.width, posy);
            posy+=fontSize+parseFloat(lineDistance.get());
        }
    }

    ctx.restore();
    outRatio.set(ctx.canvas.height/ctx.canvas.width);


    if(!cachetexture.get() || !textureOut.get()) textureOut.set(new CGL.Texture.createFromImage( cgl, fontImage, { filter:CGL.Texture.FILTER_MIPMAP } ));
        else textureOut.get().initTexture(fontImage,CGL.Texture.FILTER_MIPMAP);

    textureOut.get().unpackAlpha=true;
}

align.onChange=refresh;
valign.onChange=refresh;
text.onChange=refresh;
inFontSize.onChange=refresh;
font.onChange=refresh;
lineDistance.onChange=refresh;
maximize.onChange=refresh;

texWidth.onChange=reSize;
texHeight.onChange=reSize;

border.onChange=refresh;

text.set('cables');
reSize();

};

Ops.Gl.Textures.TextTexture.prototype = new CABLES.Op();
CABLES.OPS["84a1d08e-c0c7-4f73-9e15-06dd86e854d3"]={f:Ops.Gl.Textures.TextTexture,objName:"Ops.Gl.Textures.TextTexture"};




// **************************************************************
// 
// Ops.Gl.Texture_v2
// 
// **************************************************************

Ops.Gl.Texture_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    filename=op.inUrl("File","image"),
    tfilter=op.inSwitch("Filter",['nearest','linear','mipmap']),
    wrap=op.inValueSelect("Wrap",['repeat','mirrored repeat','clamp to edge'],"clamp to edge"),
    aniso=op.inSwitch("Anisotropic",[0,1,2,4,8,16],0),
    flip=op.inValueBool("Flip",false),
    unpackAlpha=op.inValueBool("Pre Multiplied Alpha",false),
    active=op.inValueBool("Active",true),
    textureOut=op.outTexture("Texture"),
    width=op.outValue("Width"),
    height=op.outValue("Height"),
    ratio=op.outValue("Aspect Ratio"),
    loaded=op.outValue("Loaded");

op.setPortGroup("Size",[width,height]);

unpackAlpha.hidePort();

op.toWorkPortsNeedToBeLinked(textureOut);

const cgl=op.patch.cgl;

var loadedFilename=null;
var loadingId=null;
var tex=null;
var cgl_filter=0;
var cgl_wrap=0;
var cgl_aniso=0;
var timedLoader=0;

filename.onChange=flip.onChange=function(){reloadSoon();};
aniso.onChange=tfilter.onChange=onFilterChange;
wrap.onChange=onWrapChange;
unpackAlpha.onChange=function(){ reloadSoon(); };

loaded.set(false);

tfilter.set('mipmap');
wrap.set('repeat');

textureOut.set(CGL.Texture.getEmptyTexture(cgl));

active.onChange=function()
{
    if(active.get())
    {
        if(loadedFilename!=filename.get()) realReload();
        else textureOut.set(tex);
    }
    else textureOut.set(CGL.Texture.getEmptyTexture(cgl));
};

var setTempTexture=function()
{
    var t=CGL.Texture.getTempTexture(cgl);
    textureOut.set(t);
};

function reloadSoon(nocache)
{
    clearTimeout(timedLoader);
    timedLoader=setTimeout(function()
    {
        realReload(nocache);
    },30);
}

function realReload(nocache)
{
    if(!active.get())return;
    if(!loadingId)loadingId=cgl.patch.loading.start('textureOp',filename.get());

    var url=op.patch.getFilePath(String(filename.get()));
    if(nocache)url+='?rnd='+CABLES.generateUUID();


    loadedFilename=filename.get();

    if((filename.get() && filename.get().length>1))
    {
        loaded.set(false);

        op.setUiAttrib({"extendTitle":CABLES.basename(url)});
        op.refreshParams();

        if(tex)tex.delete();
        tex=CGL.Texture.load(cgl,url,
            function(err)
            {
                if(err)
                {
                    setTempTexture();
                    console.log(err);
                    op.setUiError('urlerror','could not load texture:<br/>"'+filename.get()+'"',2);
                    cgl.patch.loading.finished(loadingId);
                    return;
                }
                else op.setUiError('urlerror',null);
                textureOut.set(tex);
                width.set(tex.width);
                height.set(tex.height);
                ratio.set(tex.width/tex.height);

                if(!tex.isPowerOfTwo())  op.setUiError('npot','Texture dimensions not power of two! - Texture filtering will not work in WebGL 1.',0);
                else op.setUiError('npot',null);

                textureOut.set(null);
                textureOut.set(tex);


                loaded.set(true);
                cgl.patch.loading.finished(loadingId);

            },{
                anisotropic:cgl_aniso,
                wrap:cgl_wrap,
                flip:flip.get(),
                unpackAlpha:unpackAlpha.get(),
                filter:cgl_filter
            });

        textureOut.set(null);
        textureOut.set(tex);

    }
    else
    {
        cgl.patch.loading.finished(loadingId);
        setTempTexture();
    }
}

function onFilterChange()
{
    if(tfilter.get()=='nearest') cgl_filter=CGL.Texture.FILTER_NEAREST;
    else if(tfilter.get()=='linear') cgl_filter=CGL.Texture.FILTER_LINEAR;
    else if(tfilter.get()=='mipmap') cgl_filter=CGL.Texture.FILTER_MIPMAP;
    else if(tfilter.get()=='Anisotropic') cgl_filter=CGL.Texture.FILTER_ANISOTROPIC;

    cgl_aniso=parseFloat(aniso.get());

    reloadSoon();
}

function onWrapChange()
{
    if(wrap.get()=='repeat') cgl_wrap=CGL.Texture.WRAP_REPEAT;
    if(wrap.get()=='mirrored repeat') cgl_wrap=CGL.Texture.WRAP_MIRRORED_REPEAT;
    if(wrap.get()=='clamp to edge') cgl_wrap=CGL.Texture.WRAP_CLAMP_TO_EDGE;

    reloadSoon();
}

op.onFileChanged=function(fn)
{
    if(filename.get() && filename.get().indexOf(fn)>-1)
    {
        textureOut.set(null);
        textureOut.set(CGL.Texture.getTempTexture(cgl));
        realReload(true);
    }
};



};

Ops.Gl.Texture_v2.prototype = new CABLES.Op();
CABLES.OPS["790f3702-9833-464e-8e37-6f0f813f7e16"]={f:Ops.Gl.Texture_v2,objName:"Ops.Gl.Texture_v2"};




// **************************************************************
// 
// Ops.Gl.Meshes.Sphere_v2
// 
// **************************************************************

Ops.Gl.Meshes.Sphere_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    TAU = Math.PI * 2,
    cgl = op.patch.cgl,
    inTrigger = op.inTrigger("render"),
    inRadius = op.inValue("radius", 1),
    inStacks = op.inValue("stacks", 32),
    inSlices = op.inValue("slices", 32),
    inStacklimit = op.inValueSlider("Filloffset", 1),
    inDraw = op.inValueBool("Render", true),
    outTrigger = op.outTrigger("trigger"),
    outGeometry = op.outObject("geometry"),
    UP = vec3.fromValues(0,1,0),
    RIGHT = vec3.fromValues(1,0,0)
;

var
    geom = new CGL.Geometry("Sphere"),
    tmpNormal = vec3.create(),
    tmpVec = vec3.create(),
    needsRebuild = true,
    mesh
;

function buildMesh () {
    const
        stacks = Math.max(inStacks.get(),2),
        slices = Math.max(inSlices.get(),3),
        stackLimit = Math.min(Math.max(inStacklimit.get()*stacks,1),stacks),
        radius = inRadius.get()
    ;

    var
        positions = [],
        texcoords = [],
        normals = [],
        tangents = [],
        biTangents = [],
        indices = [],
        x,y,z,d,t,a,
        o,u,v,i,j
    ;

    for (i = o = 0; i < stacks + 1; i++) {
        v = (i/stacks-.5)*Math.PI;
        y = Math.sin(v);
        a = Math.cos(v);
        // for (j = 0; j < slices+1; j++) {
        for (j = slices; j >=0; j--) {
            u = (j/slices)*TAU;
            x = Math.cos(u)*a;
            z = Math.sin(u)*a;

            positions.push(x*radius,y*radius,z*radius);
            // texcoords.push(i/(stacks+1),j/slices);
            texcoords.push(j/slices,i/(stacks+1));

            d = Math.sqrt(x*x+y*y+z*z);
            normals.push(
                tmpNormal[0] = x/d,
                tmpNormal[1] = y/d,
                tmpNormal[2] = z/d
            );

            if (y == d) t = RIGHT;
            else t = UP;
            vec3.cross(tmpVec, tmpNormal, t);
            vec3.normalize(tmpVec,tmpVec);
            Array.prototype.push.apply(tangents, tmpVec);
            vec3.cross(tmpVec, tmpVec, tmpNormal);
            Array.prototype.push.apply(biTangents, tmpVec);
        }
        if (i == 0 || i > stackLimit) continue;
        for(j = 0; j < slices; j++,o++) {
            indices.push(
                o,o+1,o+slices+1,
                o+1,o+slices+2,o+slices+1
            );
        }
        o++;
    }

    // set geometry
    geom.clear();
    geom.vertices = positions;
    geom.texCoords = texcoords;
    geom.vertexNormals = normals;
    geom.tangents = tangents;
    geom.biTangents = biTangents;
    geom.verticesIndices = indices;

    outGeometry.set(null);
    outGeometry.set(geom);

    if (!mesh) mesh = new CGL.Mesh(cgl, geom);
    else mesh.setGeom(geom);

    needsRebuild = false;
}

// set event handlers
inTrigger.onTriggered = function () {
    if (needsRebuild) buildMesh();
    if (inDraw.get()) mesh.render(cgl.getShader());
    outTrigger.trigger();
};

inStacks.onChange =
inSlices.onChange =
inStacklimit.onChange =
inRadius.onChange = function() {
    // only calculate once, even after multiple settings could were changed
    needsRebuild = true;
};

// set lifecycle handlers
op.onDelete = function () { if(mesh)mesh.dispose(); };


};

Ops.Gl.Meshes.Sphere_v2.prototype = new CABLES.Op();
CABLES.OPS["450b4d68-2278-4d9f-9849-0abdfa37ef69"]={f:Ops.Gl.Meshes.Sphere_v2,objName:"Ops.Gl.Meshes.Sphere_v2"};




// **************************************************************
// 
// Ops.Html.Cursor
// 
// **************************************************************

Ops.Html.Cursor = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    cursorPort = op.inValueSelect("cursor",["auto","crosshair","pointer","hand","move","n-resize","ne-resize","e-resize","se-resize","s-resize","sw-resize","w-resize","nw-resize","text","wait","help", "none"]),
    trigger=op.inTriggerButton("Set Cursor"),
    cgl = op.patch.cgl;

cursorPort.onChange=trigger.onTriggered=update;

function update()
{
    var cursor = cursorPort.get();
    cgl.canvas.style.cursor = cursor;
}



};

Ops.Html.Cursor.prototype = new CABLES.Op();
CABLES.OPS["409f94da-6264-435c-8e73-03e8d2275e04"]={f:Ops.Html.Cursor,objName:"Ops.Html.Cursor"};


window.addEventListener('load', function(event) {
CABLES.jsLoaded=new Event('CABLES.jsLoaded');
document.dispatchEvent(CABLES.jsLoaded);
});
