"use strict";

var CABLES=CABLES||{};
CABLES.OPS=CABLES.OPS||{};

var Ops=Ops || {};
Ops.Gl=Ops.Gl || {};
Ops.Anim=Ops.Anim || {};
Ops.User=Ops.User || {};
Ops.Math=Ops.Math || {};
Ops.Color=Ops.Color || {};
Ops.Value=Ops.Value || {};
Ops.Sidebar=Ops.Sidebar || {};
Ops.Boolean=Ops.Boolean || {};
Ops.Devices=Ops.Devices || {};
Ops.Trigger=Ops.Trigger || {};
Ops.WebAudio=Ops.WebAudio || {};
Ops.Gl.Matrix=Ops.Gl.Matrix || {};
Ops.Gl.Meshes=Ops.Gl.Meshes || {};
Ops.User.timothe=Ops.User.timothe || {};
Ops.Math.Compare=Ops.Math.Compare || {};
Ops.Devices.Mouse=Ops.Devices.Mouse || {};
Ops.Gl.ShaderEffects=Ops.Gl.ShaderEffects || {};
Ops.Devices.Keyboard=Ops.Devices.Keyboard || {};
Ops.Gl.TextureEffects=Ops.Gl.TextureEffects || {};



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
// Ops.Gl.Render2Texture
// 
// **************************************************************

Ops.Gl.Render2Texture = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const cgl=op.patch.cgl;

const
    render=op.inTrigger('render'),
    useVPSize=op.inValueBool("use viewport size",true),
    width=op.inValueInt("texture width",512),
    height=op.inValueInt("texture height",512),
    aspect=op.inBool("Auto Aspect",false),
    tfilter=op.inSwitch("filter",['nearest','linear','mipmap'],'linear'),
    msaa=op.inSwitch("MSAA",["none","2x","4x","8x"],"none"),
    trigger=op.outTrigger('trigger'),
    tex=op.outTexture("texture"),
    texDepth=op.outTexture("textureDepth"),
    fpTexture=op.inValueBool("HDR"),
    depth=op.inValueBool("Depth",true),
    clear=op.inValueBool("Clear",true);

var fb=null;
var reInitFb=true;
tex.set(CGL.Texture.getEmptyTexture(cgl));

op.setPortGroup('Size',[useVPSize,width,height,aspect]);


// todo why does it only work when we render a mesh before>?>?????
// only happens with matcap material with normal map....

useVPSize.onChange=updateVpSize;

function updateVpSize()
{
    width.setUiAttribs({"greyout":useVPSize.get()});
    height.setUiAttribs({"greyout":useVPSize.get()});
    aspect.setUiAttribs({"greyout":useVPSize.get()});
}

function initFbLater()
{
    reInitFb=true;
}

fpTexture.onChange=
    depth.onChange=
    clear.onChange=
    tfilter.onChange=
    msaa.onChange=initFbLater;

function doRender()
{
    if(!fb || reInitFb)
    {
        if(fb) fb.delete();
        if(cgl.glVersion>=2)
        {
            var ms=true;
            var msSamples=4;

            if(msaa.get()=="none")
            {
                msSamples=0;
                ms=false;
            }
            if(msaa.get()=="2x")msSamples=2;
            if(msaa.get()=="4x")msSamples=4;
            if(msaa.get()=="8x")msSamples=8;

            fb=new CGL.Framebuffer2(cgl,8,8,
            {
                isFloatingPointTexture:fpTexture.get(),
                multisampling:ms,
                depth:depth.get(),
                multisamplingSamples:msSamples,
                clear:clear.get()
            });
        }
        else
        {
            fb=new CGL.Framebuffer(cgl,8,8,{isFloatingPointTexture:fpTexture.get()});
        }

        if(tfilter.get()=='nearest') fb.setFilter(CGL.Texture.FILTER_NEAREST);
        else if(tfilter.get()=='linear') fb.setFilter(CGL.Texture.FILTER_LINEAR);
        else if(tfilter.get()=='mipmap') fb.setFilter(CGL.Texture.FILTER_MIPMAP);

        texDepth.set(fb.getTextureDepth());
        reInitFb=false;
    }

    if(useVPSize.val)
    {
        width.set( cgl.getViewPort()[2] );
        height.set( cgl.getViewPort()[3] );
    }

    if(fb.getWidth()!=Math.ceil(width.get()) || fb.getHeight()!=Math.ceil(height.get()) )
    {
        fb.setSize(
            Math.max(1,Math.ceil(width.get())),
            Math.max(1,Math.ceil(height.get())) );
    }

    fb.renderStart(cgl);

    if(aspect.get()) mat4.perspective(cgl.pMatrix, 45, width.get() / height.get(), 0.1, 1000.0);


    trigger.trigger();
    fb.renderEnd(cgl);

    cgl.resetViewPort();

    tex.set( CGL.Texture.getEmptyTexture(op.patch.cgl));

    tex.set( fb.getTextureColor() );
}


render.onTriggered=doRender;
op.preRender=doRender;


updateVpSize();

};

Ops.Gl.Render2Texture.prototype = new CABLES.Op();
CABLES.OPS["d01fa820-396c-4cb5-9d78-6b14762852af"]={f:Ops.Gl.Render2Texture,objName:"Ops.Gl.Render2Texture"};




// **************************************************************
// 
// Ops.Gl.Meshes.FullscreenRectangle
// 
// **************************************************************

Ops.Gl.Meshes.FullscreenRectangle = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={shader_frag:"UNI sampler2D tex;\nIN vec2 texCoord;\n\nvoid main()\n{\n   outColor= texture(tex,vec2(texCoord.x,(1.0-texCoord.y)));\n}\n",shader_vert:"{{MODULES_HEAD}}\n\nIN vec3 vPosition;\nUNI mat4 projMatrix;\nUNI mat4 mvMatrix;\n\nOUT vec2 texCoord;\nIN vec2 attrTexCoord;\n\nvoid main()\n{\n   vec4 pos=vec4(vPosition,  1.0);\n\n   texCoord=attrTexCoord;\n\n   gl_Position = projMatrix * mvMatrix * pos;\n}\n",};
const
    render=op.inTrigger('render'),
    centerInCanvas=op.inValueBool("Center in Canvas"),
    flipY=op.inValueBool("Flip Y"),
    flipX=op.inValueBool("Flip X"),
    inTexture=op.inTexture("Texture"),
    trigger=op.outTrigger('trigger');

const cgl=op.patch.cgl;
var mesh=null;
var geom=new CGL.Geometry("fullscreen rectangle");
var x=0,y=0,z=0,w=0,h=0;

centerInCanvas.onChange=rebuild;
    flipX.onChange=rebuildFlip;
    flipY.onChange=rebuildFlip;

const shader=new CGL.Shader(cgl,'fullscreenrectangle');
shader.setModules(['MODULE_VERTEX_POSITION','MODULE_COLOR','MODULE_BEGIN_FRAG']);

shader.setSource(attachments.shader_vert,attachments.shader_frag);
shader.fullscreenRectUniform=new CGL.Uniform(shader,'t','tex',0);

var useShader=false;
var updateShaderLater=true;
render.onTriggered=doRender;

op.toWorkPortsNeedToBeLinked(render);

inTexture.onChange=function()
{
    updateShaderLater=true;
};

function updateShader()
{
    var tex=inTexture.get();
    if(tex) useShader=true;
        else useShader=false;
}

op.preRender=function()
{
    updateShader();
    // if(useShader)
    {
        shader.bind();
        if(mesh)mesh.render(shader);
        doRender();
    }
};

function doRender()
{
    if( cgl.getViewPort()[2]!=w || cgl.getViewPort()[3]!=h ||!mesh ) rebuild();

    if(updateShaderLater) updateShader();

    cgl.pushPMatrix();
    mat4.identity(cgl.pMatrix);
    mat4.ortho(cgl.pMatrix, 0, w,h, 0, -10.0, 1000);

    cgl.pushModelMatrix();
    mat4.identity(cgl.mMatrix);

    cgl.pushViewMatrix();
    mat4.identity(cgl.vMatrix);

    if(centerInCanvas.get())
    {
        var x=0;
        var y=0;
        if(w<cgl.canvasWidth) x=(cgl.canvasWidth-w)/2;
        if(h<cgl.canvasHeight) y=(cgl.canvasHeight-h)/2;

        cgl.setViewPort(x,y,w,h);
    }

    if(useShader)
    {
        if(inTexture.get())
        {
            cgl.setTexture(0,inTexture.get().tex);
            // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, inTexture.get().tex);
        }

        mesh.render(shader);
    }
    else
    {
        mesh.render(cgl.getShader());
    }

    cgl.gl.clear(cgl.gl.DEPTH_BUFFER_BIT);

    cgl.popPMatrix();
    cgl.popModelMatrix();
    cgl.popViewMatrix();

    trigger.trigger();
}

function rebuildFlip()
{
    mesh=null;
}


function rebuild()
{
    const currentViewPort=cgl.getViewPort();

    if(currentViewPort[2]==w && currentViewPort[3]==h && mesh)return;

    var xx=0,xy=0;

    w=currentViewPort[2];
    h=currentViewPort[3];

    geom.vertices = new Float32Array([
         xx+w, xy+h,  0.0,
         xx,   xy+h,  0.0,
         xx+w, xy,    0.0,
         xx,   xy,    0.0
    ]);

    var tc=null;

    if(flipY.get())
        tc=new Float32Array([
            1.0, 0.0,
            0.0, 0.0,
            1.0, 1.0,
            0.0, 1.0
        ]);
    else
        tc=new Float32Array([
            1.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            0.0, 0.0
        ]);

    if(flipX.get())
    {
        tc[0]=0.0;
        tc[2]=1.0;
        tc[4]=0.0;
        tc[6]=1.0;
    }

    geom.setTexCoords(tc);

    geom.verticesIndices = new Float32Array([
        2, 1, 0,
        3, 1, 2
    ]);


    geom.vertexNormals=new Float32Array([
        0,0,1,
        0,0,1,
        0,0,1,
        0,0,1,
        ]);
    geom.tangents=new Float32Array([
        -1,0,0,
        -1,0,0,
        -1,0,0,
        -1,0,0]);
    geom.biTangents==new Float32Array([
        0,-1,0,
        0,-1,0,
        0,-1,0,
        0,-1,0]);

                // norms.push(0,0,1);
                // tangents.push(-1,0,0);
                // biTangents.push(0,-1,0);


    if(!mesh) mesh=new CGL.Mesh(cgl,geom);
        else mesh.setGeom(geom);
}


};

Ops.Gl.Meshes.FullscreenRectangle.prototype = new CABLES.Op();
CABLES.OPS["255bd15b-cc91-4a12-9b4e-53c710cbb282"]={f:Ops.Gl.Meshes.FullscreenRectangle,objName:"Ops.Gl.Meshes.FullscreenRectangle"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.ImageCompose
// 
// **************************************************************

Ops.Gl.TextureEffects.ImageCompose = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const render=op.inTrigger("render");
// const useVPSize=op.addInPort(new CABLES.Port(op,"use viewport size",CABLES.OP_PORT_TYPE_VALUE,{ display:'bool' }));
const useVPSize=op.inBool("use viewport size");
const width=op.inValueInt("width");
const height=op.inValueInt("height");

const tfilter=op.inSwitch("filter",['nearest','linear','mipmap'],"linear");
const twrap=op.inValueSelect("wrap",['clamp to edge','repeat','mirrored repeat']);
const fpTexture=op.inValueBool("HDR");

const trigger=op.outTrigger("trigger");
const texOut=op.outTexture("texture_out");

const bgAlpha=op.inValueSlider("Background Alpha",1);
const outRatio=op.outValue("Aspect Ratio");

op.setPortGroup("Texture Size",[useVPSize,width,height]);
op.setPortGroup("Texture Settings",[twrap,tfilter,fpTexture]);



const cgl=op.patch.cgl;
texOut.set(CGL.Texture.getEmptyTexture(cgl));
var effect=null;
var tex=null;

var w=8,h=8;
var prevViewPort=[0,0,0,0];
var reInitEffect=true;

var bgFrag=''
    .endl()+'uniform float a;'
    .endl()+'void main()'
    .endl()+'{'
    .endl()+'   outColor= vec4(0.0,0.0,0.0,a);'
    .endl()+'}';
var bgShader=new CGL.Shader(cgl,'imgcompose bg');
bgShader.setSource(bgShader.getDefaultVertexShader(),bgFrag);
var uniBgAlpha=new CGL.Uniform(bgShader,'f','a',bgAlpha);

var selectedFilter=CGL.Texture.FILTER_LINEAR;
var selectedWrap=CGL.Texture.WRAP_CLAMP_TO_EDGE;

function initEffect()
{
    if(effect)effect.delete();
    if(tex)tex.delete();

    effect=new CGL.TextureEffect(cgl,{"isFloatingPointTexture":fpTexture.get()});

    tex=new CGL.Texture(cgl,
        {
            "name":"image compose",
            "isFloatingPointTexture":fpTexture.get(),
            "filter":selectedFilter,
            "wrap":selectedWrap,
            "width": Math.ceil(width.get()),
            "height": Math.ceil(height.get()),
        });

    effect.setSourceTexture(tex);
    texOut.set(CGL.Texture.getEmptyTexture(cgl));
    // texOut.set(effect.getCurrentSourceTexture());

    // texOut.set(effect.getCurrentSourceTexture());

    reInitEffect=false;

    // op.log("reinit effect");
    // tex.printInfo();
}

fpTexture.onChange=function()
{
    reInitEffect=true;

    // var e1=cgl.gl.getExtension('EXT_color_buffer_float');
    // var e2=cgl.gl.getExtension('EXT_float_blend');

};

function updateResolution()
{
    if(!effect)initEffect();

    if(useVPSize.get())
    {
        w=cgl.getViewPort()[2];
        h=cgl.getViewPort()[3];
    }
    else
    {
        w=Math.ceil(width.get());
        h=Math.ceil(height.get());
    }

    if((w!=tex.width || h!= tex.height) && (w!==0 && h!==0))
    {
        height.set(h);
        width.set(w);
        tex.setSize(w,h);
        outRatio.set(w/h);
        effect.setSourceTexture(tex);
        // texOut.set(null);
        texOut.set(CGL.Texture.getEmptyTexture(cgl));
        texOut.set(tex);
    }

    if(texOut.get())
        if(!texOut.get().isPowerOfTwo() )
        {
            if(!op.uiAttribs.hint)
                op.uiAttr(
                    {
                        hint:'texture dimensions not power of two! - texture filtering will not work.',
                        warning:null
                    });
        }
        else
        if(op.uiAttribs.hint)
        {
            op.uiAttr({hint:null,warning:null}); //todo only when needed...
        }

}


function updateSizePorts()
{
    if(useVPSize.get())
    {
        width.setUiAttribs({greyout:true});
        height.setUiAttribs({greyout:true});
    }
    else
    {
        width.setUiAttribs({greyout:false});
        height.setUiAttribs({greyout:false});
    }
}


useVPSize.onChange=function()
{
    updateSizePorts();
    if(useVPSize.get())
    {
        width.onChange=null;
        height.onChange=null;
    }
    else
    {
        width.onChange=updateResolution;
        height.onChange=updateResolution;
    }
    updateResolution();

};


op.preRender=function()
{
    doRender();
    bgShader.bind();
};


var doRender=function()
{
    if(!effect || reInitEffect)
    {
        initEffect();
    }
    var vp=cgl.getViewPort();
    prevViewPort[0]=vp[0];
    prevViewPort[1]=vp[1];
    prevViewPort[2]=vp[2];
    prevViewPort[3]=vp[3];

    cgl.gl.blendFunc(cgl.gl.SRC_ALPHA, cgl.gl.ONE_MINUS_SRC_ALPHA);

    updateResolution();

    cgl.currentTextureEffect=effect;
    effect.setSourceTexture(tex);

    effect.startEffect();

    // render background color...
    cgl.pushShader(bgShader);
    cgl.currentTextureEffect.bind();
    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex );
    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();

    texOut.set(effect.getCurrentSourceTexture());
    // texOut.set(effect.getCurrentTargetTexture());


    // if(effect.getCurrentSourceTexture.filter==CGL.Texture.FILTER_MIPMAP)
    // {
    //         this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_2D, effect.getCurrentSourceTexture.tex);
    //         effect.getCurrentSourceTexture.updateMipMap();
    //     // else
    //     // {
    //     //     this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_2D, this._textureSource.tex);;
    //     //     this._textureSource.updateMipMap();
    //     // }

    //     this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_2D, null);
    // }

    effect.endEffect();

    cgl.setViewPort(prevViewPort[0],prevViewPort[1],prevViewPort[2],prevViewPort[3]);


    cgl.gl.blendFunc(cgl.gl.SRC_ALPHA,cgl.gl.ONE_MINUS_SRC_ALPHA);

    cgl.currentTextureEffect=null;
};


function onWrapChange()
{
    if(twrap.get()=='repeat') selectedWrap=CGL.Texture.WRAP_REPEAT;
    if(twrap.get()=='mirrored repeat') selectedWrap=CGL.Texture.WRAP_MIRRORED_REPEAT;
    if(twrap.get()=='clamp to edge') selectedWrap=CGL.Texture.WRAP_CLAMP_TO_EDGE;

    reInitEffect=true;
    updateResolution();
}

twrap.set('repeat');
twrap.onChange=onWrapChange;


function onFilterChange()
{
    if(tfilter.get()=='nearest') selectedFilter=CGL.Texture.FILTER_NEAREST;
    if(tfilter.get()=='linear')  selectedFilter=CGL.Texture.FILTER_LINEAR;
    if(tfilter.get()=='mipmap')  selectedFilter=CGL.Texture.FILTER_MIPMAP;

    reInitEffect=true;
    updateResolution();
    // effect.setSourceTexture(tex);
    // updateResolution();
}

tfilter.set('linear');
tfilter.onChange=onFilterChange;

useVPSize.set(true);
render.onTriggered=doRender;
op.preRender=doRender;


width.set(640);
height.set(360);
onFilterChange();
onWrapChange();
updateSizePorts();

};

Ops.Gl.TextureEffects.ImageCompose.prototype = new CABLES.Op();
CABLES.OPS["5c04608d-1e42-4e36-be00-1be4a81fc309"]={f:Ops.Gl.TextureEffects.ImageCompose,objName:"Ops.Gl.TextureEffects.ImageCompose"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.DrawImage_v2
// 
// **************************************************************

Ops.Gl.TextureEffects.DrawImage_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={drawimage_frag:"#ifdef HAS_TEXTURES\n    IN vec2 texCoord;\n    UNI sampler2D tex;\n    UNI sampler2D image;\n#endif\n\nIN mat3 transform;\nUNI float rotate;\n\n{{CGL.BLENDMODES}}\n\n#ifdef HAS_TEXTUREALPHA\n   UNI sampler2D imageAlpha;\n#endif\n\nUNI float amount;\n\n#ifdef ASPECT_RATIO\n    UNI float aspectTex;\n    UNI float aspectPos;\n#endif\n\nvoid main()\n{\n    vec4 blendRGBA=vec4(0.0,0.0,0.0,1.0);\n    #ifdef HAS_TEXTURES\n        vec2 tc=texCoord;\n\n        #ifdef TEX_FLIP_X\n            tc.x=1.0-tc.x;\n        #endif\n        #ifdef TEX_FLIP_Y\n            tc.y=1.0-tc.y;\n        #endif\n\n        #ifdef ASPECT_RATIO\n            #ifdef ASPECT_AXIS_X\n                tc.y=(1.0-aspectPos)-(((1.0-aspectPos)-tc.y)*aspectTex);\n            #endif\n            #ifdef ASPECT_AXIS_Y\n                tc.x=(1.0-aspectPos)-(((1.0-aspectPos)-tc.x)/aspectTex);\n            #endif\n        #endif\n\n        #ifdef TEX_TRANSFORM\n            vec3 coordinates=vec3(tc.x, tc.y,1.0);\n            tc=(transform * coordinates ).xy;\n        #endif\n\n        blendRGBA=texture(image,tc);\n\n        vec3 blend=blendRGBA.rgb;\n        vec4 baseRGBA=texture(tex,texCoord);\n        vec3 base=baseRGBA.rgb;\n        vec3 colNew=_blend(base,blend);\n\n        #ifdef REMOVE_ALPHA_SRC\n            blendRGBA.a=1.0;\n        #endif\n\n        #ifdef HAS_TEXTUREALPHA\n            vec4 colImgAlpha=texture(imageAlpha,tc);\n            float colImgAlphaAlpha=colImgAlpha.a;\n\n            #ifdef ALPHA_FROM_LUMINANCE\n                vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), colImgAlpha.rgb ));\n                colImgAlphaAlpha=(gray.r+gray.g+gray.b)/3.0;\n            #endif\n\n            #ifdef ALPHA_FROM_INV_UMINANCE\n                vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), colImgAlpha.rgb ));\n                colImgAlphaAlpha=1.0-(gray.r+gray.g+gray.b)/3.0;\n            #endif\n\n            blendRGBA.a=colImgAlphaAlpha*blendRGBA.a;\n        #endif\n    #endif\n\n    #ifdef CLIP_REPEAT\n        if(tc.y>1.0 || tc.y<0.0 || tc.x>1.0 || tc.x<0.0)colNew.rgb=vec3(0.0);\n    #endif\n\n    #ifdef ASPECT_RATIO\n        #ifdef ASPECT_CROP\n            if(tc.y>1.0 || tc.y<0.0 || tc.x>1.0 || tc.x<0.0) colNew.rgb=base.rgb;//vec3(0.0);\n        #endif\n    #endif\n\n    blendRGBA.rgb=mix( colNew, base ,1.0-blendRGBA.a*amount);\n    blendRGBA.a=1.0;\n\n    outColor= blendRGBA;\n\n}",drawimage_vert:"IN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN vec3 attrVertNormal;\n\nUNI mat4 projMatrix;\nUNI mat4 mvMatrix;\n\nUNI float posX;\nUNI float posY;\nUNI float scaleX;\nUNI float scaleY;\nUNI float rotate;\n\nOUT vec2 texCoord;\nOUT vec3 norm;\nOUT mat3 transform;\n\nvoid main()\n{\n   texCoord=attrTexCoord;\n   norm=attrVertNormal;\n\n   #ifdef TEX_TRANSFORM\n        vec3 coordinates=vec3(attrTexCoord.x, attrTexCoord.y,1.0);\n        float angle = radians( rotate );\n        vec2 scale= vec2(scaleX,scaleY);\n        vec2 translate= vec2(posX,posY);\n\n        transform = mat3(   scale.x * cos( angle ), scale.x * sin( angle ), 0.0,\n            - scale.y * sin( angle ), scale.y * cos( angle ), 0.0,\n            - 0.5 * scale.x * cos( angle ) + 0.5 * scale.y * sin( angle ) - 0.5 * translate.x*2.0 + 0.5,  - 0.5 * scale.x * sin( angle ) - 0.5 * scale.y * cos( angle ) - 0.5 * translate.y*2.0 + 0.5, 1.0);\n   #endif\n\n   gl_Position = projMatrix * mvMatrix * vec4(vPosition,  1.0);\n}\n",};
var render=op.inTrigger('render');
var blendMode=CGL.TextureEffect.AddBlendSelect(op,"blendMode");
var amount=op.inValueSlider("amount",1);

var image=op.inTexture("image");
var removeAlphaSrc=op.inValueBool("removeAlphaSrc",false);

var imageAlpha=op.inTexture("imageAlpha");
var alphaSrc=op.inValueSelect("alphaSrc",['alpha channel','luminance','luminance inv']);
var invAlphaChannel=op.inValueBool("invert alpha channel");

const inAspect=op.inValueBool("Aspect Ratio",false);
const inAspectAxis=op.inValueSelect("Stretch Axis",['X','Y'],"X");
const inAspectPos=op.inValueSlider("Position",0.0);
const inAspectCrop=op.inValueBool("Crop",false);


var trigger=op.outTrigger('trigger');

blendMode.set('normal');
var cgl=op.patch.cgl;
var shader=new CGL.Shader(cgl,'drawimage');


imageAlpha.onLinkChanged=updateAlphaPorts;

op.setPortGroup("Mask",[imageAlpha,alphaSrc,invAlphaChannel]);
op.setPortGroup("Aspect Ratio",[inAspect,inAspectPos,inAspectCrop,inAspectAxis]);


removeAlphaSrc.onChange=updateRemoveAlphaSrc;

function updateAlphaPorts()
{
    if(imageAlpha.isLinked())
    {
        removeAlphaSrc.setUiAttribs({greyout:true});
        alphaSrc.setUiAttribs({greyout:false});
        invAlphaChannel.setUiAttribs({greyout:false});
    }
    else
    {
        removeAlphaSrc.setUiAttribs({greyout:false});
        alphaSrc.setUiAttribs({greyout:true});
        invAlphaChannel.setUiAttribs({greyout:true});
    }
}

op.toWorkPortsNeedToBeLinked(image);

shader.setSource(attachments.drawimage_vert,attachments.drawimage_frag);
var textureUniform=new CGL.Uniform(shader,'t','tex',0);
var textureImaghe=new CGL.Uniform(shader,'t','image',1);
var textureAlpha=new CGL.Uniform(shader,'t','imageAlpha',2);

const uniTexAspect=new CGL.Uniform(shader,'f','aspectTex',1);
const uniAspectPos=new CGL.Uniform(shader,'f','aspectPos',inAspectPos);

invAlphaChannel.onChange=function()
{
    if(invAlphaChannel.get()) shader.define('INVERT_ALPHA');
        else shader.removeDefine('INVERT_ALPHA');
};


inAspect.onChange=updateAspectRatio;
inAspectCrop.onChange=updateAspectRatio;
inAspectAxis.onChange=updateAspectRatio;
function updateAspectRatio()
{
    shader.removeDefine('ASPECT_AXIS_X');
    shader.removeDefine('ASPECT_AXIS_Y');

    if(inAspect.get())
    {
        shader.define('ASPECT_RATIO');

        if(inAspectCrop.get()) shader.define('ASPECT_CROP');
            else shader.removeDefine('ASPECT_CROP');

        if(inAspectAxis.get()=="X") shader.define('ASPECT_AXIS_X');
        if(inAspectAxis.get()=="Y") shader.define('ASPECT_AXIS_Y');


        inAspectPos.setUiAttribs({greyout:false});
        inAspectCrop.setUiAttribs({greyout:false});
        inAspectAxis.setUiAttribs({greyout:false});
    }
    else
    {
        shader.removeDefine('ASPECT_RATIO');
        if(inAspectCrop.get()) shader.define('ASPECT_CROP');
            else shader.removeDefine('ASPECT_CROP');

        if(inAspectAxis.get()=="X") shader.define('ASPECT_AXIS_X');
        if(inAspectAxis.get()=="Y") shader.define('ASPECT_AXIS_Y');

        inAspectPos.setUiAttribs({greyout:true});
        inAspectCrop.setUiAttribs({greyout:true});
        inAspectAxis.setUiAttribs({greyout:true});
    }
}




function updateRemoveAlphaSrc()
{
    if(removeAlphaSrc.get()) shader.define('REMOVE_ALPHA_SRC');
        else shader.removeDefine('REMOVE_ALPHA_SRC');
}


alphaSrc.onChange=function()
{
    shader.toggleDefine('ALPHA_FROM_LUMINANCE',alphaSrc.get()=='luminance');
    shader.toggleDefine('ALPHA_FROM_INV_UMINANCE',alphaSrc.get()=='luminance_inv');
};

alphaSrc.set("alpha channel");


{
    //
    // texture flip
    //
    var flipX=op.inValueBool("flip x");
    var flipY=op.inValueBool("flip y");

    flipX.onChange=function()
    {
        if(flipX.get()) shader.define('TEX_FLIP_X');
            else shader.removeDefine('TEX_FLIP_X');
    };

    flipY.onChange=function()
    {
        if(flipY.get()) shader.define('TEX_FLIP_Y');
            else shader.removeDefine('TEX_FLIP_Y');
    };
}

{
    //
    // texture transform
    //

    var doTransform=op.inValueBool("Transform");

    var scaleX=op.inValueSlider("Scale X",1);
    var scaleY=op.inValueSlider("Scale Y",1);

    var posX=op.inValue("Position X",0);
    var posY=op.inValue("Position Y",0);

    var rotate=op.inValue("Rotation",0);

    var inClipRepeat=op.inValueBool("Clip Repeat",false);

    inClipRepeat.onChange=updateClip;
    function updateClip()
    {
        if(inClipRepeat.get()) shader.define('CLIP_REPEAT');
            else shader.removeDefine('CLIP_REPEAT');
    }


    var uniScaleX=new CGL.Uniform(shader,'f','scaleX',scaleX);
    var uniScaleY=new CGL.Uniform(shader,'f','scaleY',scaleY);

    var uniPosX=new CGL.Uniform(shader,'f','posX',posX);
    var uniPosY=new CGL.Uniform(shader,'f','posY',posY);
    var uniRotate=new CGL.Uniform(shader,'f','rotate',rotate);

    doTransform.onChange=updateTransformPorts;
}

function updateTransformPorts()
{
    shader.toggleDefine('TEX_TRANSFORM',doTransform.get());
    if(doTransform.get())
    {
        // scaleX.setUiAttribs({hidePort:false});
        // scaleY.setUiAttribs({hidePort:false});
        // posX.setUiAttribs({hidePort:false});
        // posY.setUiAttribs({hidePort:false});
        // rotate.setUiAttribs({hidePort:false});

        scaleX.setUiAttribs({greyout:false});
        scaleY.setUiAttribs({greyout:false});
        posX.setUiAttribs({greyout:false});
        posY.setUiAttribs({greyout:false});
        rotate.setUiAttribs({greyout:false});
    }
    else
    {
        scaleX.setUiAttribs({greyout:true});
        scaleY.setUiAttribs({greyout:true});
        posX.setUiAttribs({greyout:true});
        posY.setUiAttribs({greyout:true});
        rotate.setUiAttribs({greyout:true});

        // scaleX.setUiAttribs({"hidePort":true});
        // scaleY.setUiAttribs({"hidePort":true});
        // posX.setUiAttribs({"hidePort":true});
        // posY.setUiAttribs({"hidePort":true});
        // rotate.setUiAttribs({"hidePort":true});


    }

    // op.refreshParams();
}

CGL.TextureEffect.setupBlending(op,shader,blendMode,amount);

var amountUniform=new CGL.Uniform(shader,'f','amount',amount);

imageAlpha.onChange=function()
{
    if(imageAlpha.get() && imageAlpha.get().tex)
    {
        shader.define('HAS_TEXTUREALPHA');
    }
    else
    {
        shader.removeDefine('HAS_TEXTUREALPHA');
    }
};

function doRender()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;

    var tex=image.get();
    if(tex && tex.tex && amount.get()>0.0)
    {
        cgl.pushShader(shader);
        cgl.currentTextureEffect.bind();

        const imgTex=cgl.currentTextureEffect.getCurrentSourceTexture();
        cgl.setTexture(0,imgTex.tex );

        uniTexAspect.setValue( 1/(tex.height/tex.width*imgTex.width/imgTex.height));



        cgl.setTexture(1, tex.tex );
        // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, image.get().tex );

        if(imageAlpha.get() && imageAlpha.get().tex)
        {
            cgl.setTexture(2, imageAlpha.get().tex );
            // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, imageAlpha.get().tex );
        }

        cgl.currentTextureEffect.finish();
        cgl.popShader();
    }

    trigger.trigger();
}

render.onTriggered=doRender;
updateTransformPorts();
updateRemoveAlphaSrc();
updateAlphaPorts();
updateAspectRatio();


};

Ops.Gl.TextureEffects.DrawImage_v2.prototype = new CABLES.Op();
CABLES.OPS["f94b5136-61fd-4558-8348-e7c8db5a6348"]={f:Ops.Gl.TextureEffects.DrawImage_v2,objName:"Ops.Gl.TextureEffects.DrawImage_v2"};




// **************************************************************
// 
// Ops.Trigger.Repeat_v2
// 
// **************************************************************

Ops.Trigger.Repeat_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe=op.inTrigger("Execute"),
    num=op.inValueInt("Repeats",5),
    dir=op.inSwitch("Direction",['Forward','Backward'],'Forward'),
    next=op.outTrigger("Next"),
    idx=op.addOutPort(new CABLES.Port(op,"index"));

dir.onChange=updateDir;
updateDir();

function updateDir()
{
    if(dir.get()=="Forward") exe.onTriggered=forward;
    else exe.onTriggered=backward;
}

function forward()
{
    const max=Math.floor(num.get());

    for(var i=0;i<max;i++)
    {
        idx.set(i);
        next.trigger();
    }
}

function backward()
{
    const numi=Math.floor(num.get());
    for(var i=numi-1;i>-1;i--)
    {
        idx.set(i);
        next.trigger();
    }
}


};

Ops.Trigger.Repeat_v2.prototype = new CABLES.Op();
CABLES.OPS["a4deea80-db97-478f-ad1a-5ee30f2f47cc"]={f:Ops.Trigger.Repeat_v2,objName:"Ops.Trigger.Repeat_v2"};




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
// Ops.Gl.ShaderEffects.AreaDiscardPixel
// 
// **************************************************************

Ops.Gl.ShaderEffects.AreaDiscardPixel = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={areadiscard_frag:"\n\nfloat MOD_de=0.0;\n\n#ifdef MOD_AREA_SPHERE\n    MOD_de=distance(vec3(MOD_x,MOD_y,MOD_z)/MOD_sizeAxis,MOD_areaPos.xyz/MOD_sizeAxis);\n#endif\n\n#ifdef MOD_AREA_BOX\n    if( abs(MOD_y/MOD_sizeAxis.y-MOD_areaPos.y/(MOD_sizeAxis.y*MOD_size))>0.5 ||\n        abs(MOD_x/MOD_sizeAxis.x-MOD_areaPos.x/(MOD_sizeAxis.x*MOD_size))>0.5 ||\n        abs(MOD_z/MOD_sizeAxis.z-MOD_areaPos.z/(MOD_sizeAxis.z*MOD_size))>0.5 ) MOD_de=1.0;\n#endif\n\n#ifdef MOD_AREA_AXIS_X\n    MOD_de=abs(MOD_x-MOD_areaPos.x);\n#endif\n#ifdef MOD_AREA_AXIS_XY\n    MOD_de=abs(MOD_x-MOD_areaPos.x+MOD_areaPos.y);\n#endif\n#ifdef MOD_AREA_AXIS_XZ\n    MOD_de=abs(MOD_x-MOD_areaPos.x+MOD_areaPos.z);\n#endif\n#ifdef MOD_AREA_AXIS_YZ\n    MOD_de=abs(MOD_y-MOD_areaPos.y+MOD_areaPos.z);\n#endif\n#ifdef MOD_AREA_AXIS_Y\n    MOD_de=abs(MOD_y-MOD_areaPos.y);\n#endif\n#ifdef MOD_AREA_AXIS_Z\n    MOD_de=abs(MOD_z-MOD_areaPos.z);\n#endif\n\n#ifdef MOD_AREA_AXIS_X_INFINITE\n    MOD_de=MOD_x-MOD_areaPos.x;\n#endif\n#ifdef MOD_AREA_AXIS_Y_INFINITE\n    MOD_de=MOD_y-MOD_areaPos.y;\n#endif\n#ifdef MOD_AREA_AXIS_Z_INFINITE\n    MOD_de=MOD_z-MOD_areaPos.z;\n#endif\n\n#ifdef MOD_AREA_REPEAT\n    MOD_de=mod(MOD_de,MOD_size+MOD_repeat);\n#endif\n\nMOD_de=MOD_de/MOD_size;\n\n#ifdef MOD_AREA_INVERT\n    MOD_de=1.0-MOD_de;\n#endif\n\n\nif(MOD_de<=0.5) discard;\n\n",areadiscard_head_frag:"IN vec4 MOD_areaPos;\nUNI float MOD_size;\nUNI float MOD_amount;\nUNI vec3 MOD_sizeAxis;\n\nUNI float MOD_x;\nUNI float MOD_y;\nUNI float MOD_z;\nUNI float MOD_repeat;",};
const cgl=op.patch.cgl;

op.render=op.inTrigger("render");

const
    inInvert=op.inValueBool("Invert"),
    inArea=op.inValueSelect("Area",["Sphere","Box","Axis X","Axis Y","Axis Z","Axis XY","Axis XZ","Axis YZ","Axis X Infinite","Axis Y Infinite","Axis Z Infinite"],"Sphere"),
    inSize=op.inValue("Size",1),
    inSizeX=op.inValueFloat("Size X",1),
    inSizeY=op.inValueFloat("Size Y",1),
    inSizeZ=op.inValueFloat("Size Z",1),
    inRepeat=op.inValueBool("Repeat"),
    inRepeatDist=op.inValueFloat("Repeat Distance",0.0),
    x=op.inValue("x"),
    y=op.inValue("y"),
    z=op.inValue("z"),
    inWorldSpace=op.inValueBool("WorldSpace",true);

op.trigger=op.outTrigger("trigger");



op.setPortGroup("Size",[inSize,inSizeY,inSizeX,inSizeZ]);
op.setPortGroup("Position",[x,y,z,inWorldSpace]);


var shader=null;

var srcHeadVert=''
    .endl()+'OUT vec4 MOD_areaPos;'
    .endl();

var srcBodyVert=''
    .endl()+'#ifndef MOD_WORLDSPACE'
    .endl()+'   MOD_areaPos=pos;'
    .endl()+'#endif'
    .endl()+'#ifdef MOD_WORLDSPACE'
    .endl()+'   MOD_areaPos=mMatrix*pos;'
    .endl()+'#endif'
    .endl();

var moduleFrag=null;
var moduleVert=null;

op.render.onLinkChanged=removeModule;
inWorldSpace.onChange=updateWorldspace;
inArea.onChange=updateArea;
inInvert.onChange=updateInvert;
inRepeat.onChange=updateRepeat;


function updateInvert()
{
    if(!shader)return;
    if(inInvert.get()) shader.define(moduleVert.prefix+"AREA_INVERT");
        else shader.removeDefine(moduleVert.prefix+"AREA_INVERT");
}

function updateRepeat()
{
    if(!shader)return;
    if(inRepeat.get()) shader.define(moduleVert.prefix+"AREA_REPEAT");
        else shader.removeDefine(moduleVert.prefix+"AREA_REPEAT");
}

function updateArea()
{
    if(!shader)return;

    // shader.removeDefine(moduleVert.prefix+"AREA_AXIS_X");
    // shader.removeDefine(moduleVert.prefix+"AREA_AXIS_Y");
    // shader.removeDefine(moduleVert.prefix+"AREA_AXIS_Z");
    // shader.removeDefine(moduleVert.prefix+"AREA_AXIS_XY");
    // shader.removeDefine(moduleVert.prefix+"AREA_AXIS_XZ");
    // shader.removeDefine(moduleVert.prefix+"AREA_AXIS_X_INFINITE");
    // shader.removeDefine(moduleVert.prefix+"AREA_AXIS_Y_INFINITE");
    // shader.removeDefine(moduleVert.prefix+"AREA_AXIS_Z_INFINITE");

    shader.toggleDefine(moduleVert.prefix+"AREA_BOX",inArea.get()=="Box");
    shader.toggleDefine(moduleVert.prefix+"AREA_SPHERE",inArea.get()=="Sphere");

    shader.toggleDefine(moduleVert.prefix+"AREA_AXIS_X",inArea.get()=="Axis X");
    shader.toggleDefine(moduleVert.prefix+"AREA_AXIS_Y",inArea.get()=="Axis Y");
    shader.toggleDefine(moduleVert.prefix+"AREA_AXIS_Z",inArea.get()=="Axis Z");
    shader.toggleDefine(moduleVert.prefix+"AREA_AXIS_XY",inArea.get()=="Axis XY");
    shader.toggleDefine(moduleVert.prefix+"AREA_AXIS_XZ",inArea.get()=="Axis XZ");
    shader.toggleDefine(moduleVert.prefix+"AREA_AXIS_YZ",inArea.get()=="Axis YZ");



    shader.toggleDefine(moduleVert.prefix+"AREA_AXIS_X_INFINITE",inArea.get()=="Axis X Infinite");
    shader.toggleDefine(moduleVert.prefix+"AREA_AXIS_Y_INFINITE",inArea.get()=="Axis Y Infinite");
    shader.toggleDefine(moduleVert.prefix+"AREA_AXIS_Z_INFINITE",inArea.get()=="Axis Z Infinite");


    // if(inArea.get()=="Axis X")shader.define(moduleVert.prefix+"AREA_AXIS_X");
    // else if(inArea.get()=="Axis Y")shader.define(moduleVert.prefix+"AREA_AXIS_Y");
    // else if(inArea.get()=="Axis Z")shader.define(moduleVert.prefix+"AREA_AXIS_Z");
    // else if(inArea.get()=="Axis XY")shader.define(moduleVert.prefix+"AREA_AXIS_XY");
    // else if(inArea.get()=="Axis XZ")shader.define(moduleVert.prefix+"AREA_AXIS_XZ");

    // else if(inArea.get()=="Axis X Infinite")shader.define(moduleVert.prefix+"AREA_AXIS_X_INFINITE");
    // else if(inArea.get()=="Axis Y Infinite")shader.define(moduleVert.prefix+"AREA_AXIS_Y_INFINITE");
    // else if(inArea.get()=="Axis Z Infinite")shader.define(moduleVert.prefix+"AREA_AXIS_Z_INFINITE");




}

function updateWorldspace()
{
    if(!shader)return;
    if(inWorldSpace.get()) shader.define(moduleVert.prefix+"WORLDSPACE");
        else shader.removeDefine(moduleVert.prefix+"WORLDSPACE");
}

function removeModule()
{
    if(shader && moduleFrag) shader.removeModule(moduleFrag);
    if(shader && moduleVert) shader.removeModule(moduleVert);
    shader=null;
}

op.render.onTriggered=function()
{

    if(op.isCurrentUiOp())
        gui.setTransformGizmo(
            {
                posX:x,
                posY:y,
                posZ:z
            });

    if(CABLES.UI && CABLES.UI.renderHelper)
    {
        CABLES.GL_MARKER.drawSphere(op,inSize.get());
    }

    if(!cgl.getShader())
    {
         op.trigger.trigger();
         return;
    }

    if(cgl.getShader()!=shader)
    {
        if(shader) removeModule();
        shader=cgl.getShader();

        moduleVert=shader.addModule(
            {
                priority:2,
                title:op.objName,
                name:'MODULE_VERTEX_POSITION',
                srcHeadVert:srcHeadVert,
                srcBodyVert:srcBodyVert
            });

        moduleFrag=shader.addModule(
            {
                title:op.objName,
                name:'MODULE_COLOR',
                srcHeadFrag:attachments.areadiscard_head_frag||'',
                srcBodyFrag:attachments.areadiscard_frag||''
            },moduleVert);

        inSize.uniform=new CGL.Uniform(shader,'f',moduleFrag.prefix+'size',inSize);

        x.uniform=new CGL.Uniform(shader,'f',moduleFrag.prefix+'x',x);
        y.uniform=new CGL.Uniform(shader,'f',moduleFrag.prefix+'y',y);
        z.uniform=new CGL.Uniform(shader,'f',moduleFrag.prefix+'z',z);


        op.uniformSizeXYZ=new CGL.Uniform(shader,'3f',moduleFrag.prefix+'sizeAxis',inSizeX,inSizeY,inSizeZ);


        inRepeatDist.uniform=new CGL.Uniform(shader,'f',moduleFrag.prefix+'repeat',inRepeatDist);

        updateWorldspace();
        updateArea();
        updateInvert();
        updateRepeat();
    }

    if(!shader)return;

    op.trigger.trigger();
};















};

Ops.Gl.ShaderEffects.AreaDiscardPixel.prototype = new CABLES.Op();
CABLES.OPS["85846539-6ef7-46ba-aaf5-156bb6f49b87"]={f:Ops.Gl.ShaderEffects.AreaDiscardPixel,objName:"Ops.Gl.ShaderEffects.AreaDiscardPixel"};




// **************************************************************
// 
// Ops.Math.Subtract
// 
// **************************************************************

Ops.Math.Subtract = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    number1=op.inValue("number1",1),
    number2=op.inValue("number2",1),
    result=op.outValue("result");

number1.onChange=exec;
number2.onChange=exec;
exec();

function exec()
{
    var v=number1.get()-number2.get();
    if(!isNaN(v)) result.set( v );
}



};

Ops.Math.Subtract.prototype = new CABLES.Op();
CABLES.OPS["a4ffe852-d200-4b96-9347-68feb01122ca"]={f:Ops.Math.Subtract,objName:"Ops.Math.Subtract"};




// **************************************************************
// 
// Ops.Value.Number
// 
// **************************************************************

Ops.Value.Number = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const v=op.inValueFloat("value");
const result=op.outValue("result");

v.onChange=exec;

function exec()
{
    result.set(parseFloat(v.get()));
}

};

Ops.Value.Number.prototype = new CABLES.Op();
CABLES.OPS["8fb2bb5d-665a-4d0a-8079-12710ae453be"]={f:Ops.Value.Number,objName:"Ops.Value.Number"};




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
// Ops.Gl.TextureEffects.Blur
// 
// **************************************************************

Ops.Gl.TextureEffects.Blur = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={blur_frag:"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI float dirX;\nUNI float dirY;\nUNI float amount;\n\n#ifdef HAS_MASK\n    UNI sampler2D imageMask;\n#endif\n\nfloat random(vec3 scale, float seed)\n{\n    return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);\n}\n\nvoid main()\n{\n    vec4 color = vec4(0.0);\n    float total = 0.0;\n\n    float am=amount;\n    #ifdef HAS_MASK\n        am=amount*texture(imageMask,texCoord).r;\n        if(am<=0.02)\n        {\n            outColor=texture(tex, texCoord);\n            return;\n        }\n    #endif\n\n    vec2 delta=vec2(dirX*am*0.01,dirY*am*0.01);\n\n\n    float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);\n\n    #ifdef MOBILE\n        offset = 0.1;\n    #endif\n\n    #if defined(FASTBLUR) && !defined(MOBILE)\n        const float range=5.0;\n    #else\n        const float range=20.0;\n    #endif\n\n    for (float t = -range; t <= range; t+=1.0)\n    {\n        float percent = (t + offset - 0.5) / range;\n        float weight = 1.0 - abs(percent);\n        vec4 smpl = texture(tex, texCoord + delta * percent);\n\n        smpl.rgb *= smpl.a;\n\n        color += smpl * weight;\n        total += weight;\n    }\n\n    outColor= color / total;\n\n    outColor.rgb /= outColor.a + 0.00001;\n\n\n\n}\n",};
const render=op.inTrigger('render');
const trigger=op.outTrigger('trigger');
const amount=op.inValueFloat("amount");
const direction=op.inSwitch("direction",['both','vertical','horizontal'],'both');
const fast=op.inValueBool("Fast",true);
const cgl=op.patch.cgl;

amount.set(10);

var shader=new CGL.Shader(cgl);

shader.define("FASTBLUR");

fast.onChange=function()
{
    if(fast.get()) shader.define("FASTBLUR");
    else shader.removeDefine("FASTBLUR");
};

shader.setSource(shader.getDefaultVertexShader(),attachments.blur_frag);
var textureUniform=new CGL.Uniform(shader,'t','tex',0);

var uniDirX=new CGL.Uniform(shader,'f','dirX',0);
var uniDirY=new CGL.Uniform(shader,'f','dirY',0);

var uniWidth=new CGL.Uniform(shader,'f','width',0);
var uniHeight=new CGL.Uniform(shader,'f','height',0);

var uniAmount=new CGL.Uniform(shader,'f','amount',amount.get());
amount.onChange=function(){ uniAmount.setValue(amount.get()); };

var textureAlpha=new CGL.Uniform(shader,'t','imageMask',1);

var showingError = false;

function fullScreenBlurWarning ()
{
    if(cgl.currentTextureEffect.getCurrentSourceTexture().width == cgl.canvasWidth &&
        cgl.currentTextureEffect.getCurrentSourceTexture().height == cgl.canvasHeight)
    {
        op.setUiError('warning','Full screen blurs are slow! Try reducing the resolution to 1/2 or a 1/4',0);
    }
    else
    {
        op.setUiError('warning',null);
    }
};

var dir=0;
direction.onChange=function()
{
    if(direction.get()=='both')dir=0;
    if(direction.get()=='horizontal')dir=1;
    if(direction.get()=='vertical')dir=2;
};

var mask=op.inTexture("mask");

mask.onChange=function()
{
    if(mask.get() && mask.get().tex) shader.define('HAS_MASK');
        else shader.removeDefine('HAS_MASK');
};

render.onTriggered=function()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;

    cgl.pushShader(shader);

    uniWidth.setValue(cgl.currentTextureEffect.getCurrentSourceTexture().width);
    uniHeight.setValue(cgl.currentTextureEffect.getCurrentSourceTexture().height);

    fullScreenBlurWarning();

    // first pass
    if(dir===0 || dir==2)
    {

        cgl.currentTextureEffect.bind();
        cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex );


        if(mask.get() && mask.get().tex)
        {
            cgl.setTexture(1, mask.get().tex );
            // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, mask.get().tex );
        }


        uniDirX.setValue(0.0);
        uniDirY.setValue(1.0);

        cgl.currentTextureEffect.finish();
    }

    // second pass
    if(dir===0 || dir==1)
    {

        cgl.currentTextureEffect.bind();
        cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex );


        if(mask.get() && mask.get().tex)
        {
            cgl.setTexture(1, mask.get().tex );
            // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, mask.get().tex );
        }

        uniDirX.setValue(1.0);
        uniDirY.setValue(0.0);

        cgl.currentTextureEffect.finish();
    }

    cgl.popShader();
    trigger.trigger();
};





};

Ops.Gl.TextureEffects.Blur.prototype = new CABLES.Op();
CABLES.OPS["54f26f53-f637-44c1-9bfb-a2f2b722e998"]={f:Ops.Gl.TextureEffects.Blur,objName:"Ops.Gl.TextureEffects.Blur"};




// **************************************************************
// 
// Ops.Anim.SimpleAnim
// 
// **************************************************************

Ops.Anim.SimpleAnim = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe=op.inTrigger("exe"),
    reset=op.inTriggerButton("reset"),
    rewind=op.inTriggerButton("rewind"),
    inStart=op.inValueFloat("start",0),
    inEnd=op.inValueFloat("end",1),
    duration=op.inValueFloat("duration",0.5),
    loop=op.inValueBool("loop"),
    waitForReset=op.inValueBool("Wait for Reset",true),
    next=op.outTrigger("Next"),
    result=op.outValue("result"),
    finished=op.outValue("finished"),
    finishedTrigger=op.outTrigger("Finished Trigger");

const anim=new CABLES.Anim();
var resetted=false;
anim.createPort(op,"easing",init);
var currentEasing=-1;
loop.onChange=init;
init();

duration.onChange=init;


function init()
{
    if(anim.keys.length!=3)
    {
        anim.setValue(0,0);
        anim.setValue(1,0);
        anim.setValue(2,0);
    }

    anim.keys[0].time=CABLES.now()/1000.0;
    anim.keys[0].value=inStart.get();
    if(anim.defaultEasing!=currentEasing) anim.keys[0].setEasing(anim.defaultEasing);

    anim.keys[1].time=duration.get()+CABLES.now()/1000.0;
    anim.keys[1].value=inEnd.get();

    if(anim.defaultEasing!=currentEasing) anim.keys[1].setEasing(anim.defaultEasing);

    anim.loop=loop.get();
    if(anim.loop)
    {
        anim.keys[2].time=(2.0*duration.get())+CABLES.now()/1000.0;
        anim.keys[2].value=inStart.get();
        if(anim.defaultEasing!=currentEasing) anim.keys[2].setEasing(anim.defaultEasing);
    }
    else
    {
        anim.keys[2].time=anim.keys[1].time;
        anim.keys[2].value=anim.keys[1].value;
        if(anim.defaultEasing!=currentEasing) anim.keys[2].setEasing(anim.defaultEasing);
    }
    finished.set(false);

    currentEasing=anim.defaultEasing;
}

reset.onTriggered=function()
{
    resetted=true;
    init();
};

rewind.onTriggered=function()
{
    anim.keys[0].time=CABLES.now()/1000.0;
    anim.keys[0].value=inStart.get();

    anim.keys[1].time=CABLES.now()/1000.0;
    anim.keys[1].value=inStart.get();

    anim.keys[2].time=CABLES.now()/1000.0;
    anim.keys[2].value=inStart.get();

    result.set(inStart.get());
};

exe.onTriggered=function()
{
    if(waitForReset.get() && !resetted)
    {
        result.set(inStart.get());
        return;
    }
    var t=CABLES.now()/1000;
    var v=anim.getValue(t);
    result.set(v);
    if(anim.hasEnded(t))
    {
        if(!finished.get()) finishedTrigger.trigger();
        finished.set(true);
    }

    next.trigger();
};



};

Ops.Anim.SimpleAnim.prototype = new CABLES.Op();
CABLES.OPS["5b244b6e-c505-4743-b2cc-8119ef720028"]={f:Ops.Anim.SimpleAnim,objName:"Ops.Anim.SimpleAnim"};




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
// Ops.Gl.TextureEffects.EdgeDetection_v2
// 
// **************************************************************

Ops.Gl.TextureEffects.EdgeDetection_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={edgedetect_frag:"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI float amount;\nUNI float strength;\nUNI float texWidth;\nUNI float texHeight;\nUNI float mulColor;\n\nconst vec4 lumcoeff = vec4(0.299,0.587,0.114, 0.);\n\nvec3 desaturate(vec3 color)\n{\n    return vec3(dot(vec3(0.2126,0.7152,0.0722), color));\n}\n\n{{CGL.BLENDMODES}}\n\nvoid main()\n{\n    // vec4 col=vec4(1.0,0.0,0.0,1.0);\n\n    float pixelX=strength/texWidth;\n    float pixelY=strength/texHeight;\n\n    // col=texture(tex,texCoord);\n\n    float count=1.0;\n\n\tvec4 horizEdge = vec4( 0.0 );\n\thorizEdge -= texture( tex, vec2( texCoord.x - pixelX, texCoord.y - pixelY ) ) * 1.0;\n\thorizEdge -= texture( tex, vec2( texCoord.x - pixelX, texCoord.y     ) ) * 2.0;\n\thorizEdge -= texture( tex, vec2( texCoord.x - pixelX, texCoord.y + pixelY ) ) * 1.0;\n\thorizEdge += texture( tex, vec2( texCoord.x + pixelX, texCoord.y - pixelY ) ) * 1.0;\n\thorizEdge += texture( tex, vec2( texCoord.x + pixelX, texCoord.y     ) ) * 2.0;\n\thorizEdge += texture( tex, vec2( texCoord.x + pixelX, texCoord.y + pixelY ) ) * 1.0;\n\tvec4 vertEdge = vec4( 0.0 );\n\tvertEdge -= texture( tex, vec2( texCoord.x - pixelX, texCoord.y - pixelY ) ) * 1.0;\n\tvertEdge -= texture( tex, vec2( texCoord.x    , texCoord.y - pixelY ) ) * 2.0;\n\tvertEdge -= texture( tex, vec2( texCoord.x + pixelX, texCoord.y - pixelY ) ) * 1.0;\n\tvertEdge += texture( tex, vec2( texCoord.x - pixelX, texCoord.y + pixelY ) ) * 1.0;\n\tvertEdge += texture( tex, vec2( texCoord.x    , texCoord.y + pixelY ) ) * 2.0;\n\tvertEdge += texture( tex, vec2( texCoord.x + pixelX, texCoord.y + pixelY ) ) * 1.0;\n\n\n\tvec3 edge = sqrt((horizEdge.rgb/count * horizEdge.rgb/count) + (vertEdge.rgb/count * vertEdge.rgb/count));\n\n    edge=desaturate(edge);\n\n    if(mulColor>0.0) edge*=texture( tex, texCoord ).rgb*mulColor*4.0;\n    edge=max(min(edge,1.0),0.0);\n\n    //blend section\n    vec4 col=vec4(edge,1.0);\n    vec4 base=texture(tex,texCoord);\n\n    outColor=cgl_blend(base,col,amount);\n}\n\n",};
const
    render=op.inTrigger("Render"),
    blendMode=CGL.TextureEffect.AddBlendSelect(op,"Blend Mode","normal"),
    amount=op.inValueSlider("Amount",1),
    strength=op.inValueSlider("strength",1),
    mulColor=op.inValueSlider("Mul Color",0),
    trigger=op.outTrigger("Trigger");

const cgl=op.patch.cgl;
const shader=new CGL.Shader(cgl);


shader.setSource(shader.getDefaultVertexShader(),attachments.edgedetect_frag);

const
    textureUniform=new CGL.Uniform(shader,'t','tex',0),
    amountUniform=new CGL.Uniform(shader,'f','amount',amount),
    strengthUniform=new CGL.Uniform(shader,'f','strength',strength),
    uniWidth=new CGL.Uniform(shader,'f','texWidth',128),
    uniHeight=new CGL.Uniform(shader,'f','texHeight',128),
    uniMulColor=new CGL.Uniform(shader,'f','mulColor',mulColor);

CGL.TextureEffect.setupBlending(op,shader,blendMode,amount);

render.onTriggered=function()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

    uniWidth.setValue(cgl.currentTextureEffect.getCurrentSourceTexture().width);
    uniHeight.setValue(cgl.currentTextureEffect.getCurrentSourceTexture().height);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};

};

Ops.Gl.TextureEffects.EdgeDetection_v2.prototype = new CABLES.Op();
CABLES.OPS["ca2e8b01-77b8-4838-ba03-d93437e7bfc0"]={f:Ops.Gl.TextureEffects.EdgeDetection_v2,objName:"Ops.Gl.TextureEffects.EdgeDetection_v2"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.Vignette_v2
// 
// **************************************************************

Ops.Gl.TextureEffects.Vignette_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={vignette_frag:"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI float lensRadius1;\nUNI float aspect;\nUNI float amount;\nUNI float strength;\nUNI float sharp;\n\nUNI float r,g,b;\n\n{{CGL.BLENDMODES}}\n\nvoid main()\n{\n    vec4 vcol=vec4(r,g,b,1.0);\n    vec4 col=texture(tex,texCoord);\n    vec2 tcPos=vec2(texCoord.x,(texCoord.y-0.5)*aspect+0.5);\n    float dist = distance(tcPos, vec2(0.5,0.5));\n    float am = (1.0-smoothstep( (lensRadius1+0.5), (lensRadius1*0.99+0.5)*sharp, dist));\n\n    col=mix(col,vcol,am*strength);\n    vec4 base=texture(tex,texCoord);\n\n\n    outColor=cgl_blend(base,col,amount);\n\n\n\n}\n",};
const
     render=op.inTrigger("Render"),
     blendMode=CGL.TextureEffect.AddBlendSelect(op,"Blend Mode","normal"),
     amount=op.inValueSlider("Amount",1),
     trigger=op.outTrigger("Trigger"),
     strength=op.inValueSlider("Strength",1),
     lensRadius1=op.inValueSlider("Radius",0.3),
     sharp=op.inValueSlider("Sharp",0.25),
     aspect=op.inValue("Aspect",1),
     r = op.inValueSlider("r", 0),
     g = op.inValueSlider("g", 0),
     b = op.inValueSlider("b", 0);

r.setUiAttribs({ colorPick: true });

const cgl=op.patch.cgl;
const shader=new CGL.Shader(cgl,'vignette');

shader.setSource(shader.getDefaultVertexShader(),attachments.vignette_frag);

const
    textureUniform=new CGL.Uniform(shader,'t','tex',0),
    amountUniform=new CGL.Uniform(shader,'f','amount',amount),
    uniLensRadius1=new CGL.Uniform(shader,'f','lensRadius1',lensRadius1),
    uniaspect=new CGL.Uniform(shader,'f','aspect',aspect),
    unistrength=new CGL.Uniform(shader,'f','strength',strength),
    unisharp=new CGL.Uniform(shader,'f','sharp',sharp),
    unir=new CGL.Uniform(shader,'f','r',r),
    unig=new CGL.Uniform(shader,'f','g',g),
    unib=new CGL.Uniform(shader,'f','b',b);

CGL.TextureEffect.setupBlending(op,shader,blendMode,amount);

render.onTriggered=function()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.TextureEffects.Vignette_v2.prototype = new CABLES.Op();
CABLES.OPS["ee274501-ac60-49ab-a854-80aa38c36f76"]={f:Ops.Gl.TextureEffects.Vignette_v2,objName:"Ops.Gl.TextureEffects.Vignette_v2"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.BarrelDistortion_v2
// 
// **************************************************************

Ops.Gl.TextureEffects.BarrelDistortion_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={barreldistort_frag:"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI float amount;\nUNI float intensity;\n\n{{CGL.BLENDMODES}}\n\n// adapted from https://www.shadertoy.com/view/MlSXR3\n\nvec2 brownConradyDistortion(vec2 uv)\n{\n// positive values of K1 give barrel distortion, negative give pincushion\n    float barrelDistortion1 = intensity*10.; // K1 in text books\n    float barrelDistortion2 = 0.; // K2 in text books\n    float r2 = uv.x*uv.x + uv.y*uv.y;\n    uv *= 1.0 + barrelDistortion1 * r2 + barrelDistortion2 * r2 * r2;\n\n    // tangential distortion (due to off center lens elements)\n    // is not modeled in this function, but if it was, the terms would go here\n    return uv;\n}\n\nvoid main()\n{\n   vec2 tc=brownConradyDistortion(texCoord-0.5)+0.5;\n   vec4 col=texture(tex,texCoord);\n   outColor=cgl_blend(col,texture(tex,tc),amount);\n}",};
const
    render=op.inTrigger('render'),
    blendMode=CGL.TextureEffect.AddBlendSelect(op,"Blend Mode","normal"),
    amount = op.inValueSlider("Amount",1.0),
    intensity=op.inValue("Intensity",10.),
    trigger=op.outTrigger('Trigger');

const cgl=op.patch.cgl;
const shader=new CGL.Shader(cgl);

shader.setSource(shader.getDefaultVertexShader(),attachments.barreldistort_frag);

const
    textureUniform=new CGL.Uniform(shader,'t','tex',0),
    uniintensity=new CGL.Uniform(shader,'f','intensity',0),
    amountUniform = new CGL.Uniform(shader,'f','amount',amount);

CGL.TextureEffect.setupBlending(op,shader,blendMode,amount);

render.onTriggered=function()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;
    var texture=cgl.currentTextureEffect.getCurrentSourceTexture();

    uniintensity.setValue(intensity.get()*(1/texture.width));

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, texture.tex );
    // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, texture.tex );

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.TextureEffects.BarrelDistortion_v2.prototype = new CABLES.Op();
CABLES.OPS["6ac723ad-5442-435a-b600-e18ba82ceff7"]={f:Ops.Gl.TextureEffects.BarrelDistortion_v2,objName:"Ops.Gl.TextureEffects.BarrelDistortion_v2"};




// **************************************************************
// 
// Ops.Math.TriggerRandomNumber_v2
// 
// **************************************************************

Ops.Math.TriggerRandomNumber_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe=op.inTriggerButton('Generate'),
    min=op.inValue("min",0),
    max=op.inValue("max",1),
    outTrig = op.outTrigger("next"),
    result=op.outValue("result"),
    inInteger=op.inValueBool("Integer",false);

exe.onTriggered=genRandom;
max.onChange=genRandom;
min.onChange=genRandom;
inInteger.onChange=genRandom;

op.setPortGroup("Value Range",[min,max]);
genRandom();

function genRandom()
{
    var r=(Math.random()*(max.get()-min.get()))+min.get();
    if(inInteger.get())r=Math.floor((Math.random()*((max.get()-min.get()+1)))+min.get());
    result.set(r);
    outTrig.trigger();
}


};

Ops.Math.TriggerRandomNumber_v2.prototype = new CABLES.Op();
CABLES.OPS["26f446cc-9107-4164-8209-5254487fa132"]={f:Ops.Math.TriggerRandomNumber_v2,objName:"Ops.Math.TriggerRandomNumber_v2"};




// **************************************************************
// 
// Ops.Trigger.TriggerOnce
// 
// **************************************************************

Ops.Trigger.TriggerOnce = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe=op.inTriggerButton("Exec"),
    reset=op.inTriggerButton("Reset"),
    next=op.outTrigger("Next");
var outTriggered=op.outValue("Was Triggered");

var triggered=false;

op.toWorkPortsNeedToBeLinked(exe);

reset.onTriggered=function()
{
    triggered=false;
    outTriggered.set(triggered);
};

exe.onTriggered=function()
{
    if(triggered)return;

    triggered=true;
    next.trigger();
    outTriggered.set(triggered);

};

};

Ops.Trigger.TriggerOnce.prototype = new CABLES.Op();
CABLES.OPS["cf3544e4-e392-432b-89fd-fcfb5c974388"]={f:Ops.Trigger.TriggerOnce,objName:"Ops.Trigger.TriggerOnce"};




// **************************************************************
// 
// Ops.Devices.Keyboard.KeyPress
// 
// **************************************************************

Ops.Devices.Keyboard.KeyPress = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var cgl=op.patch.cgl;

var onPress=op.addOutPort(new CABLES.Port(op,"on press",CABLES.OP_PORT_TYPE_FUNCTION));
var keyCode=op.addOutPort(new CABLES.Port(op,"key code",CABLES.OP_PORT_TYPE_VALUE));
var char=op.outValue("Char");

function onKeyPress(e)
{
    char.set(e.key);
    keyCode.set(e.keyCode);
    onPress.trigger();
}

op.onDelete=function()
{
    cgl.canvas.removeEventListener('keypress', onKeyPress);
};

cgl.canvas.addEventListener("keypress", onKeyPress );


};

Ops.Devices.Keyboard.KeyPress.prototype = new CABLES.Op();
CABLES.OPS["023d1e35-1231-4c50-a044-4a0e63609ba5"]={f:Ops.Devices.Keyboard.KeyPress,objName:"Ops.Devices.Keyboard.KeyPress"};




// **************************************************************
// 
// Ops.Gl.Orthogonal_v2
// 
// **************************************************************

Ops.Gl.Orthogonal_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    render=op.inTrigger('render'),
    bounds=op.inValue("bounds",2),
    fixAxis=op.inSwitch("Axis",["X","Y"],"X"),
    zNear=op.inValue("frustum near",0.01),
    zFar=op.inValue("frustum far",100),
    trigger=op.outTrigger('trigger'),
    outRatio=op.outValue("Ratio"),
    outWidth=op.outValue("Width"),
    outHeight=op.outValue("Height")
    ;

const cgl=op.patch.cgl;

render.onTriggered=function()
{
    const vp=cgl.getViewPort();

    if(fixAxis.get()=="X")
    {
        const ratio=vp[3]/vp[2];

        cgl.pushPMatrix();
        mat4.ortho(
            cgl.pMatrix,
            -bounds.get(),
            bounds.get(),
            -bounds.get()*ratio,
            bounds.get()*ratio,
            parseFloat(zNear.get()),
            parseFloat(zFar.get())
            );

        outWidth.set(bounds.get()*2);
        outHeight.set(bounds.get()*ratio*2);
        outRatio.set(ratio);
    }
    else
    {
        const ratio=vp[2]/vp[3];

        cgl.pushPMatrix();
        mat4.ortho(
            cgl.pMatrix,
            -bounds.get()*ratio,
            bounds.get()*ratio,
            -bounds.get(),
            bounds.get(),
            parseFloat(zNear.get()),
            parseFloat(zFar.get())
            );

        outWidth.set(bounds.get()*ratio*2);
        outHeight.set(bounds.get()*2);
        outRatio.set(ratio);
    }

    trigger.trigger();
    cgl.popPMatrix();
};




};

Ops.Gl.Orthogonal_v2.prototype = new CABLES.Op();
CABLES.OPS["b9235490-eaf2-4960-b1be-4279a4051ec6"]={f:Ops.Gl.Orthogonal_v2,objName:"Ops.Gl.Orthogonal_v2"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.ColorMap
// 
// **************************************************************

Ops.Gl.TextureEffects.ColorMap = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={colormap_frag:"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI sampler2D gradient;\nUNI float pos;\n\nfloat lumi(vec3 color)\n{\n   return vec3(dot(vec3(0.2126,0.7152,0.0722), color)).r;\n}\n\nvoid main()\n{\n   vec4 base=texture(tex,texCoord);\n   vec4 color=texture(gradient,vec2(lumi(base.rgb),pos));\n   outColor= vec4(color);\n}\n",};
var render=op.inTrigger('render');
var trigger=op.outTrigger('trigger');

var inGradient=op.inTexture("Gradient");

var inPos=op.inValueSlider("Position",0.5);

var cgl=op.patch.cgl;
var shader=new CGL.Shader(cgl);



shader.setSource(shader.getDefaultVertexShader(),attachments.colormap_frag);
var textureUniform=new CGL.Uniform(shader,'t','tex',0);

var textureUniform=new CGL.Uniform(shader,'t','gradient',1);
var uniPos=new CGL.Uniform(shader,'f','pos',inPos);


render.onTriggered=function()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;
    if(!inGradient.get())return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex );
    


    cgl.setTexture(1, inGradient.get().tex );
    // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, inGradient.get().tex );

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.TextureEffects.ColorMap.prototype = new CABLES.Op();
CABLES.OPS["58e302d7-4b84-4077-aa13-4f3cf0885205"]={f:Ops.Gl.TextureEffects.ColorMap,objName:"Ops.Gl.TextureEffects.ColorMap"};




// **************************************************************
// 
// Ops.Color.ColorPalettes
// 
// **************************************************************

Ops.Color.ColorPalettes = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const index=op.inValueInt("Index",0);
const textureOut=op.outTexture("Texture");
const inLinear=op.inValueBool("Smooth")
const arrOut=op.outArray("Color Array");

var canvas = document.createElement('canvas');
canvas.id = "canvas_"+CABLES.generateUUID();
canvas.width=5;
canvas.height=8;
canvas.style.display = "none";

var body = document.getElementsByTagName("body")[0];
body.appendChild(canvas);
var ctx = canvas.getContext('2d');

index.onChange=
inLinear.onChange=buildTexture;

var arr=[];
arr.length=5*3;
var lastFilter=null;

function hexToR(h) {
    return parseInt((cutHex(h)).substring(0,2),16);
}
function hexToG(h) {
    return parseInt((cutHex(h)).substring(2,4),16);
}
function hexToB(h) {
    return parseInt((cutHex(h)).substring(4,6),16);
}
function cutHex(h) {
    return (h.charAt(0)=="#") ? h.substring(1,7):h;
}


function buildTexture()
{
    var ind=Math.round(index.get())*5;
    if(ind>=colors.length-5)ind=0;
    if(ind<0)ind=0;
    if(ind!=ind)ind=0;

    for(var i=0;i<5;i++)
    {
        var r = hexToR(colors[ind+i]);
        var g = hexToG(colors[ind+i]);
        var b = hexToB(colors[ind+i]);

        arr[i*3+0]=r/255;
        arr[i*3+1]=g/255;
        arr[i*3+2]=b/255;

        ctx.fillStyle = 'rgb('+r+','+g+','+b+')';
        ctx.fillRect(
            canvas.width/5*i,
            0,
            canvas.width/5,
            canvas.height
            );
    }

    var filter=CGL.Texture.FILTER_NEAREST;
    if(inLinear.get())filter=CGL.Texture.FILTER_LINEAR;

    if(lastFilter==filter && textureOut.get()) textureOut.get().initTexture(canvas,filter);
        else textureOut.set(new CGL.Texture.createFromImage( op.patch.cgl, canvas, { "filter":filter } ));

    arrOut.set(null);
    arrOut.set(arr);
    textureOut.get().unpackAlpha=false;
    lastFilter=filter;

}



op.onDelete=function()
{
    canvas.remove();
};





const colors=[
'#E6E2AF','#A7A37E','#EFECCA','#046380','002F2F',
'#468966','#FFF0A5','#FFB03B','#B64926','8E2800',
'#FCFFF5','#D1DBBD','#91AA9D','#3E606F','193441',
'#FF6138','#FFFF9D','#BEEB9F','#79BD8F','00A388',
'#105B63','#FFFAD5','#FFD34E','#DB9E36','BD4932',
'#225378','#1695A3','#ACF0F2','#F3FFE2','EB7F00',
'#2C3E50','#E74C3C','#ECF0F1','#3498DB','2980B9',
'#000000','#263248','#7E8AA2','#FFFFFF','FF9800',
'#004358','#1F8A70','#BEDB39','#FFE11A','FD7400',
'#DC3522','#D9CB9E','#374140','#2A2C2B','1E1E20',
'#7D8A2E','#C9D787','#FFFFFF','#FFC0A9','FF8598',
'#B9121B','#4C1B1B','#F6E497','#FCFAE1','BD8D46',
'#2E0927','#D90000','#FF2D00','#FF8C00','04756F',
'#595241','#B8AE9C','#FFFFFF','#ACCFCC','8A0917',
'#10222B','#95AB63','#BDD684','#E2F0D6','F6FFE0',
'#F6F792','#333745','#77C4D3','#DAEDE2','EA2E49',
'#703030','#2F343B','#7E827A','#E3CDA4','C77966',
'#2F2933','#01A2A6','#29D9C2','#BDF271','FFFFA6',
'#D8CAA8','#5C832F','#284907','#382513','363942',
'#FFF8E3','#CCCC9F','#33332D','#9FB4CC','DB4105',
'#85DB18','#CDE855','#F5F6D4','#A7C520','493F0B',
'#04BFBF','#CAFCD8','#F7E967','#A9CF54','588F27',
'#292929','#5B7876','#8F9E8B','#F2E6B6','412A22',
'#332532','#644D52','#F77A52','#FF974F','A49A87',
'#405952','#9C9B7A','#FFD393','#FF974F','F54F29',
'#2B3A42','#3F5765','#BDD4DE','#EFEFEF','FF530D',
'#962D3E','#343642','#979C9C','#F2EBC7','348899',
'#96CA2D','#B5E655','#EDF7F2','#4BB5C1','7FC6BC',
'#1C1D21','#31353D','#445878','#92CDCF','EEEFF7',
'#3E454C','#2185C5','#7ECEFD','#FFF6E5','FF7F66',
'#00585F','#009393','#FFFCC4','#F0EDBB','FF3800',
'#B4AF91','#787746','#40411E','#32331D','C03000',
'#63A69F','#F2E1AC','#F2836B','#F2594B','CD2C24',
'#88A825','#35203B','#911146','#CF4A30','ED8C2B',
'#F2385A','#F5A503','#E9F1DF','#4AD9D9','36B1BF',
'#CFC291','#FFF6C5','#A1E8D9','#FF712C','695D46',
'#FF5335','#B39C85','#306E73','#3B424D','1D181F',
'#000000','#333333','#FF358B','#01B0F0','AEEE00',
'#E8E595','#D0A825','#40627C','#26393D','FFFAE4',
'#E7E8D1','#D3CEAA','#FBF7E4','#424242','8E001C',
'#354242','#ACEBAE','#FFFF9D','#C9DE55','7D9100',
'#2F2933','#01A2A6','#29D9C2','#BDF271','FFFFA6',
'#DDDCC5','#958976','#611427','#1D2326','6A6A61',
'#6C6E58','#3E423A','#417378','#A4CFBE','F4F7D9',
'#E1E6FA','#C4D7ED','#ABC8E2','#375D81','183152',
'#6B0C22','#D9042B','#F4CB89','#588C8C','011C26',
'#304269','#91BED4','#D9E8F5','#FFFFFF','F26101',
'#96CEB4','#FFEEAD','#FF6F69','#FFCC5C','AAD8B0',
'#B0CC99','#677E52','#B7CA79','#F6E8B1','89725B',
'#334D5C','#45B29D','#EFC94C','#E27A3F','DF5A49',
'#16193B','#35478C','#4E7AC7','#7FB2F0','ADD5F7',
'#00261C','#044D29','#168039','#45BF55','96ED89',
'#36362C','#5D917D','#A8AD80','#E6D4A7','825534',
'#F9E4AD','#E6B098','#CC4452','#723147','31152B',
'#2C3E50','#FC4349','#D7DADB','#6DBCDB','FFFFFF',
'#002635','#013440','#AB1A25','#D97925','EFE7BE',
'#FF8000','#FFD933','#CCCC52','#8FB359','192B33',
'#272F32','#9DBDC6','#FFFFFF','#FF3D2E','DAEAEF',
'#B8ECD7','#083643','#B1E001','#CEF09D','476C5E',
'#002F32','#42826C','#A5C77F','#FFC861','C84663',
'#5C4B51','#8CBEB2','#F2EBBF','#F3B562','F06060',
'#5A1F00','#D1570D','#FDE792','#477725','A9CC66',
'#5E0042','#2C2233','#005869','#00856A','8DB500',
'#52656B','#FF3B77','#CDFF00','#FFFFFF','B8B89F',
'#801637','#047878','#FFB733','#F57336','C22121',
'#730046','#BFBB11','#FFC200','#E88801','C93C00',
'#24221F','#363F45','#4B5F6D','#5E7C88','FEB41C',
'#E64661','#FFA644','#998A2F','#2C594F','002D40',
'#C24704','#D9CC3C','#FFEB79','#A0E0A9','00ADA7',
'#484A47','#C1CE96','#ECEBF0','#687D77','353129',
'#588C7E','#F2E394','#F2AE72','#D96459','8C4646',
'#BAB293','#A39770','#EFE4BD','#A32500','2B2922',
'#6A7059','#FDEEA7','#9BCC93','#1A9481','003D5C',
'#174C4F','#207178','#FF9666','#FFE184','F5E9BE',
'#D5FBFF','#9FBCBF','#647678','#2F3738','59D8E6',
'#DB5800','#FF9000','#F0C600','#8EA106','59631E',
'#450003','#5C0002','#94090D','#D40D12','FF1D23',
'#211426','#413659','#656F8C','#9BBFAB','F2EFDF',
'#EA6045','#F8CA4D','#F5E5C0','#3F5666','2F3440',
'#F2F2F2','#C6E070','#91C46C','#287D7D','1C344D',
'#334D5C','#45B29D','#EFC94C','#E27A3F','DF5A49',
'#705B35','#C7B07B','#E8D9AC','#FFF6D9','570026',
'#F7F2B2','#ADCF4F','#84815B','#4A1A2C','8E3557',
'#1A1F2B','#30395C','#4A6491','#85A5CC','D0E4F2',
'#25064D','#36175E','#553285','#7B52AB','9768D1',
'#004056','#2C858D','#74CEB7','#C9FFD5','FFFFCB',
'#CFCA4C','#FCF5BF','#9FE5C2','#5EB299','745A33',
'#776045','#A8C545','#DFD3B6','#FFFFFF','0092B2',
'#CC3910','#F1F2C0','#CCC59E','#8FA68E','332F29',
'#FF6600','#C13B00','#5E6D70','#424E4F','1B1D1E',
'#690011','#BF0426','#CC2738','#F2D99C','E5B96F',
'#1B1D26','#425955','#778C7A','#F1F2D8','BFBD9F',
'#F6B1C3','#F0788C','#DE264C','#BC0D35','A20D1E',
'#597533','#332F28','#61B594','#E6DEA5','C44E18',
'#3FB8AF','#7FC7AF','#DAD8A7','#FF9E9D','FF3D7F',
'#0F2D40','#194759','#296B73','#3E8C84','D8F2F0',
'#42282F','#74A588','#D6CCAD','#DC9C76','D6655A',
'#002A4A','#17607D','#FFF1CE','#FF9311','D64700',
'#003056','#04518C','#00A1D9','#47D9BF','F2D03B',
'#13140F','#D4FF00','#E4FFE6','#68776C','00D6DD',
'#FCFAD0','#A1A194','#5B605F','#464646','A90641',
'#289976','#67CC8E','#B1FF91','#FFE877','FF5600',
'#302B1D','#3F522B','#737D26','#A99E46','D9CB84',
'#56626B','#6C9380','#C0CA55','#F07C6C','AD5472',
'#32450C','#717400','#DC8505','#EC5519','BE2805',
'#C7B773','#E3DB9A','#F5FCD0','#B1C2B3','778691',
'#E83A25','#FFE9A3','#98CC96','#004563','191B28',
'#3399CC','#67B8DE','#91C9E8','#B4DCED','E8F8FF',
'#1A212C','#1D7872','#71B095','#DEDBA7','D13F32',
'#7D2A35','#CC9258','#917A56','#B4BA6C','FEFFC2',
'#E7E9D1','#D3D4AA','#FCFAE6','#444444','901808',
'#FFFFFF','#AEAEAE','#E64C66','#2D3E50','1BBC9B',
'#E0FFB3','#61C791','#31797D','#2A2F36','F23C55',
'#EB5937','#1C1919','#403D3C','#456F74','D3CBBD',
'#E6DD00','#8CB302','#008C74','#004C66','332B40',
'#14A697','#F2C12E','#F29D35','#F27649','F25252',
'#261822','#40152A','#731630','#CC1E2C','FF5434',
'#261F27','#FEE169','#CDD452','#F9722E','C9313D',
'#5C4B51','#8CBEB2','#F2EBBF','#F3B562','F06060',
'#2F3837','#C5C7B6','#FFF8D3','#4C493E','222028',
'#E3CBAC','#9C9985','#C46D3B','#788880','324654',
'#3F0B1B','#7A1631','#CF423C','#FC7D49','FFD462',
'#14212B','#293845','#4F6373','#8F8164','D9D7AC',
'#98A89E','#BAC0AC','#FAFAC6','#FF4411','D40015',
'#FEFFFF','#3C3F36','#9FB03E','#EBE9DC','72918B',
'#CC6B32','#FFAB48','#FFE7AD','#A7C9AE','888A63',
'#262526','#404040','#8C8979','#F2F2F2','F60A20',
'#00305A','#004B8D','#0074D9','#4192D9','7ABAF2',
'#0C273D','#54D0ED','#FFFEF1','#70B85D','2C5E2E',
'#4C1B33','#EFE672','#98A942','#2D6960','141D14',
'#2F3540','#666A73','#F2EDE4','#D9D1C7','8C8681',
'#0D1F30','#3B6670','#8BADA3','#F0E3C0','DB6C0F',
'#FFBC67','#DA727E','#AC6C82','#685C79','455C7B',
'#092140','#024959','#F2C777','#F24738','BF2A2A',
'#133463','#365FB7','#799AE0','#F4EFDC','BA9B65',
'#C4D4CB','#55665E','#30282A','#542733','E84167',
'#CDDEC6','#4DAAAB','#1E4F6A','#2A423C','93A189',
'#EF5411','#FA5B0F','#FF6517','#FF6D1F','FF822E',
'#41434A','#6E9489','#DEDCC3','#F2F1E9','877963',
'#292929','#2BBFBD','#F2B33D','#F29B30','F22E2E',
'#F2385A','#F5A503','#E9F1DF','#56D9CD','3AA1BF',
'#D5F8B4','#A6E3A8','#8A9A85','#7E566B','422335',
'#3CBAC8','#93EDD4','#F3F5C4','#F9CB8F','F19181',
'#979926','#38CCB5','#EEFF8E','#FFD767','CC2A09',
'#404040','#024959','#037E8C','#F2EFDC','F24C27',
'#94B34D','#D3FF82','#363D52','#121D2B','111B1C',
'#282E33','#25373A','#164852','#495E67','FF3838',
'#313732','#8AA8B0','#DEDEDE','#FFFFFF','F26101',
'#FFFFFF','#E5E1D1','#52616D','#2C343B','C44741',
'#FFF6B8','#ABCCA7','#403529','#7A5E2F','A68236',
'#4F1025','#C5003E','#D9FF5B','#78AA00','15362D',
'#49404F','#596166','#D1FFCD','#A9BD8B','948A54',
'#FF2151','#FF7729','#FFAD29','#FFEBCA','1AB58A',
'#73603D','#BF8A49','#F2CA80','#5E5A59','0D0D0D',
'#3D4C53','#70B7BA','#F1433F','#E7E1D4','FFFFFF',
'#006D8D','#008A6E','#549E39','#8AB833','C0CF3A',
'#BDDFB3','#2BAA9C','#2F2E2E','#0F2625','465F3F',
'#F2F2F2','#BF0404','#8C0303','#590202','400101',
'#76A19A','#272123','#A68D60','#B0C5BB','D9593D',
'#0E3D59','#88A61B','#F29F05','#F25C05','D92525',
'#C1E1ED','#76C7C6','#273D3B','#131A19','E35C14',
'#2D112C','#530031','#820233','#CA293E','EF4339',
'#AF7575','#EFD8A1','#BCD693','#AFD7DB','3D9CA8',
'#D74B4B','#DCDDD8','#475F77','#354B5E','FFFFFF',
'#FFF6C9','#C8E8C7','#A4DEAB','#85CC9F','499E8D',
'#229396','#8BA88F','#C7C5A7','#F0DFD0','F23C3C',
'#57385C','#A75265','#EC7263','#FEBE7E','FFEDBC',
'#96526B','#D17869','#EBAD60','#F5CF66','8BAB8D',
'#0D1C33','#17373C','#2B6832','#4F9300','A1D700',
'#1B2B32','#37646F','#A3ABAF','#E1E7E8','B22E2F',
'#C5D9B2','#53A194','#572C2C','#3D2324','695A3B',
'#425957','#81AC8B','#F2E5A2','#F89883','D96666',
'#002E40','#2A5769','#FFFFFF','#FABD4A','FA9600',
'#FFFEFC','#E2E3DF','#515B5E','#2E3233','CAF200',
'#FFF0A3','#B8CC6E','#4B6000','#E4F8FF','004460',
'#3B596A','#427676','#3F9A82','#A1CD73','ECDB60',
'#F2E6CE','#8AB39F','#606362','#593325','1D1D1F',
'#212B40','#C2E078','#FFFFFF','#BADCDD','547B97',
'#0B3C4D','#0E5066','#136480','#127899','1A8BB3',
'#222130','#464D57','#D4E8D3','#FFFCFB','ED8917',
'#B33600','#FF8A00','#FFC887','#CC5400','B31E00',
'#012530','#28544B','#ACBD86','#FFD6A0','FF302C',
'#2E95A3','#50B8B4','#C6FFFA','#E2FFA8','D6E055',
'#112F41','#068587','#4FB99F','#F2B134','ED553B',
'#202B30','#4E7178','#4FA9B8','#74C0CF','F1F7E2',
'#302B2F','#696153','#FFA600','#9BB58F','FFD596',
'#458C6B','#F2D8A7','#D9A86C','#D94436','A62424',
'#22475E','#75B08A','#F0E797','#FF9D84','FF5460',
'#FFAA5C','#DA727E','#AC6C82','#685C79','455C7B',
'#686E75','#9BAAC1','#82787B','#E4F1DB','AAC19B',
'#F0C755','#E2AD3B','#BF5C00','#901811','5C110F',
'#FFFBDC','#BFBCA5','#7F7D6E','#3F3E37','E5E2C6',
'#BEBEBE','#F1E4D8','#594735','#94C7BA','D8F1E4',
'#1B1E26','#F2EFBD','#B6D051','#70A99A','2F6D7A',
'#F7E4A2','#A7BD5B','#DC574E','#8DC7B8','ED9355',
'#70E8CB','#FFE9C7','#FF5B5B','#545454','2D2D2F',
'#17111A','#321433','#660C47','#B33467','CCBB51',
'#2B2E2E','#595855','#A2ABA5','#CAE6E8','313F54',
'#023B47','#295E52','#F2E085','#FCAB55','EE7F38',
'#302C29','#D1D1BC','#A7C4BB','#6C8C84','466964',
'#212629','#067778','#49B8A8','#85EDB6','D9E5CD',
'#334D5C','#45B29D','#EFC94C','#E27A3F','DF4949',
'#2C3E50','#FC4349','#6DBCDB','#D7DADB','FFFFFF',
'#35262D','#FFFBFF','#E8ECED','#A4B7BB','76A0B0',
'#61E8D2','#FCEEB9','#302F25','#704623','BBE687',
'#E1E6B9','#C4D7A4','#ABC8A4','#375D3B','183128',
'#C98B2F','#803C27','#C56520','#E1B41B','807916',
'#A3D9B0','#93BF9E','#F2F0D5','#8C8474','40362E',
'#524656','#CF4747','#EA7A58','#E4DCCB','A6C4BC',
'#5C2849','#A73E5C','#EC4863','#FFDA66','1FCECB',
'#0EEAFF','#15A9FA','#1B76FF','#1C3FFD','2C1DFF',
'#010000','#393845','#9B96A3','#5C0009','940315',
'#468071','#FFE87A','#FFCA53','#FF893B','E62738',
'#404040','#024959','#037E8C','#F2EFDC','F24C27',
'#FF765E','#C2AE8B','#FCCF65','#FFE5C6','B7BDC4',
'#003647','#00717D','#F2D8A7','#A4A66A','515932',
'#FAFAC0','#C4BE90','#8C644C','#594D37','293033',
'#2B3A42','#3F5765','#BDD4DE','#EFEFEF','E74C3C',
'#3B3B3B','#A8877E','#FFA49D','#FF7474','FF476C',
'#0A3A4A','#196674','#33A6B2','#9AC836','D0E64B',
'#FFA340','#38001C','#571133','#017A74','00C2BA',
'#DCEBDD','#A0D5D6','#789AA1','#304345','AD9A27',
'#588C7E','#F2E394','#F2AE72','#D96459','8C4646',
'#F0E6B1','#B5D6AA','#99A37A','#70584B','3D3536',
'#2F400D','#8CBF26','#A8CA65','#E8E5B0','419184',
'#010712','#13171F','#1C1F26','#24262D','961227',
'#403F33','#6E755F','#AFC2AA','#FFDEA1','E64C10',
'#C74029','#FAE8CD','#128085','#385052','F0AD44',
'#CFF09E','#A8DBA8','#79BD9A','#3B8686','0B486B',
'#E0401C','#E6B051','#272F30','#F7EDB7','9E2B20',
'#FFE2C5','#FFEEDD','#FFDDAA','#FFC484','FFDD99',
'#FFFFE4','#F2E5BD','#B9BF8E','#A69F7C','8C6865',
'#5C8A2D','#AFD687','#FFFFFF','#00C3A9','008798',
'#4F3130','#FF1F3D','#5BE3E3','#FDFFF1','8B9698',
'#D23600','#D95100','#DE6D00','#EE8900','FCA600',
'#FFFFFA','#A1A194','#5B605F','#464646','FF6600',
'#F34A53','#FAE3B4','#AAC789','#437356','1E4147',
'#2A7A8C','#176273','#063540','#E6D9CF','403D3A',
'#21455B','#567D8C','#A59E8C','#8C8372','F2F2F2',
'#012340','#026873','#83A603','#BBBF45','F2F0CE',
'#FDFF98','#A7DB9E','#211426','#6B073B','DA8C25',
'#002F36','#142426','#D1B748','#EDDB43','FFFD84',
'#420000','#600000','#790000','#931111','BF1616',
'#3C989E','#5DB5A4','#F4CDA5','#F57A82','ED5276',
'#23A38F','#B7C11E','#EFF1C2','#F0563D','2E313D',
'#F5ECD9','#2BACB5','#B4CCB9','#E84D5B','3B3B3B',
'#A5EB3C','#60C21E','#159E31','#53DB50','C5FFCB',
'#263138','#406155','#7C9C71','#DBC297','FF5755',
'#0A111F','#263248','#7E8AA2','#E3E3E3','C73226',
'#003B59','#00996D','#A5D900','#F2E926','FF930E',
'#00A19A','#04BF9D','#F2E85C','#F53D54','404040',
'#324152','#47535E','#796466','#C1836A','DEA677',
'#036F73','#84CDC2','#FEF2D8','#F18C79','EF504F',
'#174040','#888C65','#D9CA9C','#D98162','A65858',
'#56797F','#87A0A4','#FCFBDC','#F2DDB6','A6937C',
'#A8BAA9','#FFF5CF','#DBCDAD','#B39C7D','806854',
'#60655F','#AB9675','#FFE0C9','#D4CCBA','CF8442',
'#BDDFB3','#009D57','#2C372E','#0F2925','465F3F',
'#3E3947','#735360','#D68684','#F1B0B0','EBD0C4',
'#0A7B83','#2AA876','#FFD265','#F19C65','CE4D45',
'#FFFFFF','#F4921E','#858585','#C5D2DB','3E6B85',
'#11151E','#212426','#727564','#B9AA81','690C07',
'#000000','#910000','#CBB370','#FFFBF1','21786C',
'#F78F00','#C43911','#75003C','#37154A','0F2459',
'#003354','#91BED4','#D9E8F5','#FFFFFF','F26101',
'#3DA8A4','#7ACCBE','#FFFFF7','#FF99A1','FF5879',
'#64C733','#F0F0F0','#3E879E','#57524D','36302B',
'#343844','#2AB69D','#E65848','#FDC536','FCF2D7',
'#E34517','#F5FF53','#B4E85E','#00BD72','0B4239',
'#A84B3A','#FF9F67','#233138','#FFF7F5','4C646B',
'#59535E','#FAEEFF','#F1BAF3','#5D4970','372049',
'#FF6F22','#D9984F','#FFE8A9','#3E4237','32948A',
'#5D7370','#7FA6A1','#B8D9B8','#D6EDBD','FFF5BC',
'#FFBE00','#FFDC00','#FFD10F','#FFDE20','E8CA00',
'#003840','#005A5B','#007369','#008C72','02A676',
'#E1E6FA','#C4D7ED','#ABC8E2','#375D81','183152',
'#BA2F1D','#FFF8A4','#F5E67F','#264A59','1E2C30',
'#222526','#FFBB6E','#F28D00','#D94F00','80203B',
'#EBD096','#D1B882','#5D8A66','#1A6566','21445B',
'#F00807','#5F6273','#A4ABBF','#CCC9D1','E2E1E9',
'#DFE0AF','#A4BAA2','#569492','#41505E','383245',
'#152737','#2B4E69','#799AA5','#FFFFF0','682321',
'#C44C51','#FFB6B8','#FFEFB6','#A2B5BF','5F8CA3',
'#5ADED4','#4DAAAB','#26596A','#163342','6C98A1',
'#FF5B2B','#B1221C','#34393E','#8CC6D7','FFDA8C',
'#3D4D4D','#99992E','#E6E666','#F2FFBF','800033',
'#242424','#437346','#97D95C','#D9FF77','E9EB9B',
'#FFEBB0','#FFB05A','#F84322','#C33A1A','9F3818',
'#4D2B2F','#E57152','#E8DE67','#FFEFC3','C0CCAB',
'#A82221','#DB5E31','#EDA23E','#F2CB67','BFB840',
'#3B3140','#BFB8A3','#F2E0C9','#F2B9AC','D97E7E',
'#43464D','#9197A6','#D3DCF2','#7690CF','48577D',
'#EFDFBB','#9EBEA6','#335D6A','#D64F2A','7A8A7F',
'#000001','#313634','#C7CECF','#5C0402','941515',
'#334D5C','#45B29D','#EFC94C','#E27A3F','DF5A49',
'#F5F4E1','#D6C9B5','#B4AA97','#D44917','82877A',
'#19162B','#1C425C','#6ABDC4','#F0E4C5','D6C28F',
'#00132B','#7F9DB0','#C5E2ED','#FFFFFF','F95900',
'#1F3642','#6D968D','#B6CCB8','#FFE2B3','56493F',
'#08A689','#82BF56','#C7D93D','#E9F2A0','F2F2F2',
'#DE3961','#A4E670','#FFFFDC','#B3EECC','00ADA7',
'#849972','#D9D094','#A6A23E','#4F2F1D','8F5145',
'#F41C54','#FF9F00','#FBD506','#A8BF12','00AAB5',
'#00585F','#009393','#F5F3DC','#454445','FF5828',
'#FF6138','#FFFF9D','#BEEB9F','#79BD8F','00A388',
'#140B04','#332312','#B59D75','#E3D2B4','FFF7EA',
'#ED3B3B','#171F26','#77B59C','#F2E7B1','635656',
'#46594B','#A6977C','#D9B384','#734F30','260B01',
'#CCB8A3','#FF8FB1','#FFF5EA','#4E382F','B29882',
'#B70000','#FFFFFF','#FFCA3D','#94C4F4','0092B3',
'#053B44','#06736C','#A53539','#B9543C','EAD075',
'#E8C1B9','#FFB3AB','#FFCAB8','#E8B69C','FFCEAB',
'#E7F2DF','#69043B','#59023B','#231E2D','161726',
'#E82B1E','#E5DEAF','#A0B688','#557A66','453625',
'#F1E6D4','#BA3D49','#791F33','#9F9694','E3E1DC',
'#CED59F','#F1EDC0','#B1BEA4','#647168','282828',
'#2C3E50','#E74C3C','#ECF0F1','#3498DB','646464',
'#DE7047','#FFDE8D','#FFFFFF','#CDDE47','528540',
'#8EAB99','#40232B','#D95829','#D97338','DEC085',
'#E9662C','#EBAF3C','#00AC65','#068894','2B2B2B',
'#46483C','#A0AA8F','#EBE3CB','#FFFFFF','F26101',
'#170F0E','#290418','#505217','#FFD372','FFF1AF',
'#263545','#C4273C','#D7DADB','#6DBCDB','FFFFFF',
'#DCFAC0','#B1E1AE','#85C79C','#56AE8B','00968B',
'#075807','#097609','#70AF1A','#B9D40B','E5EB0B',
'#521000','#712800','#744E1D','#879666','F1D98C',
'#261F26','#3F3B40','#6C7367','#BFBF8A','F2E086',
'#2C3E50','#FC4349','#D7DADB','#6DBCDB','FFFFFF',
'#506D7D','#94CCB9','#FFECA7','#FFB170','F07D65',
'#3F4036','#8DA681','#F2E1C2','#BF2806','8C1D04',
'#990700','#CC542E','#FF964F','#FFCB7C','787730',
'#195073','#7F8C1F','#EE913F','#F2E5BD','9FD7C7',
'#1B3E59','#F2F0F0','#FFAC00','#BF0404','730202',
'#EA6045','#F8CA4D','#F5E5C0','#3F5666','2F3440',
'#F95759','#FDA099','#FFFFFF','#D9F3CB','8AC2B0',
'#265573','#386D73','#81A68A','#9FBF8F','D4D9B0',
'#E1DA36','#FFEA1B','#6FE4DA','#1DB0BC','007BBC',
'#013859','#185E65','#F9CC7F','#F15C25','9E1617',
'#36CC7C','#D6FFBE','#94D794','#228765','77A668',
'#94201F','#D4421F','#478A80','#D9E061','F08835',
'#F16233','#00B5B5','#F0F0F0','#3E4651','5C6D7E',
'#2E806C','#76CC99','#E0FFED','#FF5F3A','D2413C',
'#00393B','#00766C','#44A18E','#E5EDB6','F6695B',
'#734854','#F2F2E9','#D9D7C5','#A69580','736766',
'#03497E','#0596D5','#9DEBFC','#8D7754','FEB228',
'#F0E14C','#FFBB20','#FA7B12','#E85305','59CC0D',
'#FE4365','#FC9D9A','#F9CDAD','#C8C8A9','83AF9B',
'#00557C','#186D94','#3488AD','#81C1DC','BBE5F3',
'#DEE8D7','#918773','#420A1A','#240001','4D493A',
'#FFFFFF','#CAC535','#97AF25','#158471','41342C',
'#041F3D','#0B2E41','#165751','#448C61','9AC16D',
'#FA8C01','#FF6405','#577700','#082400','A0A600',
'#78C0F9','#FFDDCE','#FFFFFF','#FFDBE6','FE86A4',
'#351330','#CC2A41','#E7CAA4','#759A8A','524549',
'#02151A','#043A47','#087891','#C8C8C8','B31D14',
'#F34A53','#FAE3B4','#AAC789','#437356','1E4147',
'#58838C','#DAD7C7','#BF996B','#BF5841','A61C1C',
'#556354','#E68F0D','#8C948A','#495450','42423F',
'#323640','#5B6470','#8C94A1','#BDC7D6','DFE2FF',
'#FF0000','#FF950B','#2FA88C','#DEEB00','4B2C04',
'#0F3D48','#174C5B','#366774','#ECECE7','E96151',
'#3DBB7E','#A3CD39','#FBAC1D','#F96C1E','EE4036',
'#23363B','#A44F3F','#F8983D','#8D9151','BBC946',
'#4B5657','#969481','#D2C9B0','#F4E3C1','B6B835',
'#E8980C','#B1F543','#F2FF00','#FF5E00','59BBAB',
'#849696','#FEFFFB','#232D33','#17384D','FF972C',
'#555555','#7BB38E','#F4F1D7','#F8AB65','F15C4C',
'#1D3C42','#67BFAD','#F2EC99','#F2C48D','F25050',
'#334D5C','#45B29D','#EFC94C','#E27A3F','DF4949',
'#B8E1F2','#249AA7','#ABD25E','#F8C830','F1594A',
'#FDEDD0','#BCF1ED','#FF634D','#FD795B','FFF0AA',
'#FFFFFF','#E5E1D1','#52616D','#2C343B','C44741',
'#FFFFF1','#D5FF9B','#8FB87F','#5A7B6C','374E5A',
'#010340','#0E1E8C','#0003C7','#1510F0','1441F7',
'#002A4A','#17607D','#FFF1CE','#FF9311','E33200',
'#871E31','#CCC097','#9E9D7B','#687061','262626',
'#F16663','#F48D6C','#F2E07B','#8ABE9B','4A6D8B',
'#001F11','#204709','#0C8558','#FFD96A','FF4533',
'#1D1626','#F2E0BD','#BFAA8F','#8C786C','594C4C',
'#685D47','#913420','#1E2729','#C1D9C5','FEEFB1',
'#1D7561','#FC8448','#FF4138','#A8282B','38141B',
'#BF0633','#FF484E','#FF9273','#D1D0B4','E5ECED',
'#8E9E63','#E6DBB0','#F5EED7','#C4BCA0','176573',
'#665446','#809994','#AECCB6','#DEF2C4','E6683F',
'#3D0D26','#660A3E','#891C56','#B0276F','C93482',
'#082136','#00294D','#004B8D','#0068C4','2998FF',
'#3C4631','#9A746F','#F8A2AB','#F1C6B3','EAE9C0',
'#FF534E','#FFD7AC','#BED194','#499989','176785',
'#006D80','#BDA44D','#3C2000','#84CECC','78A419',
'#352C2B','#3C555C','#9E9657','#FFEBCD','CD5510',
'#2C3E50','#FC4349','#6DBCDB','#D7DADB','FFFFFF',
'#523631','#D1BE91','#605E3A','#4D462F','592F39',
'#18293B','#5B5A56','#F2DEA0','#D0B580','FFFBFF',
'#C8DBB6','#ECEBB7','#CCC68A','#B8B165','827A5D ',
'#7DA88C','#EBE9A0','#BED24B','#859132','35323C',
'#E8574C','#F27B29','#E6A51B','#D9CC3C','399977',
'#324032','#B7C22C','#FFFFE1','#22A8B5','2A3F42',
'#B3A589','#FFB896','#FFF9B1','#9AB385','11929E',
'#272433','#343F4F','#3D6066','#77994D','B2D249',
'#250701','#6D4320','#B0925F','#E7DEC0','82ABB8',
'#023550','#028A9E','#04BFBF','#EFEFEF','FF530D',
'#594732','#40342A','#7A422E','#D4CA9A','EDE5AE',
'#013C4D','#BA5B22','#DB913C','#F0B650','FAD46B',
'#143840','#5C6B63','#A69E89','#E0C297','D96523',
'#3FB8AF','#7FC7AF','#DAD8A7','#FFB38B','FF3F34',
'#CA3995','#F58220','#FFDF05','#BED73D','61BC46',
'#FFE1D0','#FFBFB4','#FF837E','#FF4242','BF1616',
'#C4EEFF','#7BA32D','#094201','#A41717','C48726',
'#001325','#187072','#90BD90','#D7D8A2','F2E4C2',
'#1A4F63','#068587','#6FB07F','#FCB03C','FC5B3F',
'#97B350','#333230','#736D61','#BAAB90','FFE5BA',
'#403D33','#807966','#CCC2A3','#8C0000','590000',
'#5F8A42','#86AD59','#F6FAA1','#F28410','D66011',
'#BF355D','#ED8168','#FAB66A','#F2DC86','83BFA1',
'#E1F03E','#FFBA14','#DB3A0F','#A1003D','630024',
'#212226','#45433F','#687067','#BDBB99','F0EAC3',
'#FE4365','#FC9D9A','#F9CDAD','#C8C8A9','83AF9B',
'#293B47','#5F7A87','#FFFFFF','#CBFF48','00ADA9',
'#282A33','#697371','#FFE7A6','#F5BA52','FA8000',
'#0C304A','#2B79A1','#F3F4F1','#85A71E','BFD841',
'#008B83','#4DAE83','#A0AE79','#FFE499','FF665E',
'#5D7359','#E0D697','#D6AA5C','#8C5430','661C0E',
'#324452','#97BDBF','#F2DFBB','#F28705','BF3604',
'#EEEFB9','#6ACFAE','#369C93','#232928','B03831',
'#332F45','#015770','#2A8782','#9FD6AE','FFFED2',
'#2B2830','#5C504F','#ABAB8E','#D9D7A3','C7BE88',
'#DC941B','#EDC266','#B6952C','#E1D3A6','E9A119',
'#00305A','#00448D','#0074D9','#4192D9','7ABAF2',
'#344459','#485F73','#5DA6A6','#A9D9CB','F2EAD0',
'#060719','#4D1B2F','#9E332E','#EB6528','FC9D1C',
'#96CEB4','#FFEEAD','#FF6F69','#FFCC5C','AAD8B0',
'#05F2F2','#04BFBF','#EEF1D9','#A60201','7E100E',
'#E6F1F5','#636769','#AAB3B6','#6E7476','4B4E50',
'#DA0734','#F1A20D','#4AABB1','#FCF3E7','3F1833',
'#202D44','#FC4349','#6DBCDB','#D7DADB','FFFFFF',
'#CC3B37','#398899','#FFFCE8','#FF857F','CCC1A3',
'#5DBEA9','#EFEDDF','#EF7247','#4E3F35','D1CBBA',
'#FFC62D','#E49400','#DD5200','#EFE38A','91B166',
'#B67D14','#F2921F','#F0B23E','#A62409','441208',
'#C71B1B','#D6BA8A','#017467','#E08F23','0B0D0C',
'#474143','#A69E9D','#E7E2DA','#FFFFFF','E7E8E7',
'#435772','#2DA4A8','#FEAA3A','#FD6041','CF2257',
'#6DD19D','#99E89D','#D0E8A1','#FFF9C0','D40049',
'#FAF1D5','#DEC9AC','#CCA18B','#11282D','A5C4BB',
'#000000','#141414','#1C1919','#1A1716','24201F',
'#D5D8DD','#5CA2BE','#135487','#2A4353','989DA4',
'#73161E','#BF0F30','#BFB093','#037F8C','0A2140',
'#195962','#F56F6C','#FFFFFF','#252932','191C21',
'#F8EFB6','#FEBAC5','#6CD1EA','#FACFD7','C2EAE9',
'#91D6BC','#768C6A','#755F31','#B37215','FFBA4B',
'#F2E6BB','#DD4225','#202724','#63BD99','F8FDD8',
'#762B1B','#807227','#CCBF7A','#FFEF98','60B0A1',
'#707864','#C1D74E','#F5FF7C','#DFE6B4','A6B89C',
'#FFF3D2','#97B48F','#E87657','#FF9B6F','E8D495',
'#33262E','#733230','#CC5539','#E6D27F','86A677',
'#122430','#273E45','#FFFCE2','#EBD2B5','E63531',
'#30394F','#FF434C','#6ACEEB','#EDE8DF','FFFBED',
'#0A3A4A','#196A73','#32A6A6','#A1BF36','C8D94A',
'#FFF7CC','#CCC28F','#70995C','#33664D','142933',
'#43464D','#9197A6','#D3DCF2','#7690CF','48577D',
'#DFE0AF','#A4BAA2','#569492','#41505E','383245',
'#B52841','#FFC051','#FF8939','#E85F4D','590051',
'#473C35','#A36D5C','#9C968B','#D9CEAD','8A866A',
'#DB4C39','#2D3638','#109489','#44D487','D0DB86',
'#6F8787','#AEC2AE','#E6DFAE','#B0B57B','888F51',
'#C8385A','#FFCF48','#ECEABE','#1FCECB','1CA9C9',
'#42282E','#75A48B','#D9CFB0','#DC9B74','D6665A',
'#362F2D','#4C4C4C','#94B73E','#B5C0AF','FAFDF2',
'#98293A','#B14A58','#C86C6B','#DE9D76','EFC77F',
'#C1D301','#76AB01','#0E6A00','#083500','042200',
'#453F22','#7A6B26','#CCAD5C','#A1191F','4E1716',
'#541E32','#8E3557','#88A33E','#C2BD86','F7F2B2',
'#2B1B2E','#54344D','#FFFFD6','#B89E95','6E444F',
'#6EC1A5','#9FBEA6','#F5D3A3','#FF9F88','FB7878',
'#2F252C','#D3CCB2','#99AD93','#6E6751','5C3122',
'#BE333F','#F2E9CE','#C8C5B1','#939F88','307360',
'#F0F1F2','#232625','#647362','#B3D929','D2D9B8',
'#FA2B31','#FFBF1F','#FFF146','#ABE319','00C481',
'#09455C','#527E7C','#F5FFCC','#E0EB6E','C4D224',
'#F2DA91','#F2B950','#F29D35','#D96704','BF4904',
'#A2CFA5','#E0E7AB','#F5974E','#E96B56','D24344',
'#150033','#310D42','#5C2445','#AB6946','FFCE4C',
'#23A38F','#B7C11E','#EFF1C2','#F0563D','2E313D',
'#FF2468','#E0D4B1','#FFFFE3','#00A5A6','005B63',
'#65A683','#218777','#3F585F','#47384D','F53357',
'#000623','#28475C','#4A6C74','#8BA693','F0E3C0',
'#E65322','#D19552','#B8BF73','#B6DB83','FFF991',
'#112F41','#068587','#6FB07F','#FCB03C','FC5B3F',
'#C89B41','#A16B2B','#77312B','#1C2331','152C52',
'#C24366','#D9C099','#FFF8D8','#A8E0BA','00ADA7',
'#CC0000','#006600','#FFFFEC','#9C9178','6C644F',
'#3D0319','#720435','#C1140E','#FC5008','32241B',
'#CFC7A4','#5A9E94','#005275','#002344','A38650',
'#FFEBC3','#CC3A00','#FF3600','#FF851B','800C00',
'#EFC164','#F3835D','#F35955','#286275','00434C',
'#E9F29D','#B7C29D','#878E8F','#67617A','51456B',
'#445859','#03A696','#49C4BE','#F1F2E4','FF7746',
'#FA726C','#FFD794','#BAD174','#3BA686','5F6F8C',
'#4D2B1F','#635D61','#7992A2','#97BFD5','BFDCF5',
'#CC4D00','#E6CF73','#668059','#264D4D','00CCB3',
'#4385F5','#DC4437','#FCBE1F','#109D59','FFFFFF',
'#271F2E','#A4A680','#F2EBC9','#D9B166','A66B38',
'#0B2C3C','#FF6666','#DADFE1','#FFFFFF','444444',
'#CFF09E','#A8DBA8','#79BD9A','#3B8686','0B486B',
'#302B26','#A6B827','#EDE9DD','#98D3D4','594E7A',
'#4B0505','#720707','#BFB694','#004659','00292B',
'#B52C38','#EBD1B0','#536682','#D9964B','DE6846',
'#F2F1DF','#F2B705','#F2C84B','#BF820F','734002',
'#26140C','#3D2216','#784E3D','#AB8574','D6BCB1',
'#26221D','#8C2C0F','#E6E5B8','#BFB38D','402D1F',
'#1F8181','#F2BC79','#F28972','#BF1B39','730240',
'#002635','#013440','#AB1A25','#D97925','EFE7BE',
'#8EC447','#FFFFFF','#96D3D4','#636466','2D2D2E',
'#2D1E1E','#4B3C37','#96A576','#CDE196','FFFFBE',
'#F06060','#FA987D','#F7F2CB','#72CCA7','10A296',
'#1D8281','#44BF87','#FBD258','#F29A3F','DB634F',
'#DEDE91','#EF9950','#F34E52','#C91452','492449',
'#6D8EAD','#1F3447','#1A0B07','#362416','CFCDB4',
'#00CD73','#008148','#2D9668','#3ECD8E','004E2C',
'#3D8080','#628282','#858383','#A38282','C28080',
'#475159','#839795','#B2BDB7','#CCC9C0','F2F2F2',
'#0E6870','#C6B599','#C65453','#FFDDB4','EDAA7D',
'#CEF0B7','#A8DBA8','#79BD9A','#3B8686','0B486B',
'#292C44','#FF5349','#F0F0F1','#18CDCA','4F80E1',
'#272A2B','#383737','#473B39','#692B28','940500',
'#D6C274','#DB9E46','#25706B','#3D2423','AB362E',
'#FFA68F','#FF4867','#FFF9C8','#B5EBB9','18B29D',
'#A1A16A','#727D59','#366353','#133C40','03212E',
'#D45354','#A9DC3A','#2FCAD8','#818B85','CDCDC1',
'#F14B6A','#3D3C3E','#22BDAF','#BAD7D4','F4F4F4',
'#FFE2C5','#FFEEDD','#FFDDAA','#FFC484','FFDD99',
'#9FFF4A','#1ABF93','#087363','#004040','2F1933',
'#FFDB97','#B28F4E','#FFFDFB','#466CB2','97BBFF',
'#991C00','#E09A25','#FFFCDB','#008B83','262B30',
'#44281A','#00ACAE','#F5EFD5','#F37606','EE4717',
'#FF5952','#FCEEC9','#96D6D9','#4FAAC9','176075',
'#5C4B51','#8CBEB2','#F2EBBF','#A5C88F','EF847B',
'#105F73','#F7F3B2','#C6CC33','#F28322','CC5404',
'#137072','#56B292','#B7F5AB','#FBFFC0','BF223D',
'#E3F23E','#6C821C','#A6A53F','#E0E0AC','33302E',
'#00215E','#003CAA','#1967F7','#5E4000','AA7400',
'#273A3D','#54695C','#AD9970','#FFBF87','FF8F60',
'#FFAA00','#C2B93E','#808F5D','#576157','302F30',
'#BE1405','#F2DCAC','#AABEAA','#736E41','413C2D',
'#6B1229','#C76A61','#FAB99A','#F7D9B5','CCB1A7',
'#2D9993','#58B3A3','#83BFA3','#B0D9A8','FFFCB6',
'#334D5C','#45B29D','#EFC94C','#E27A3F','DF5A49',
'#F30B55','#010326','#012840','#54717F','F2E6CE',
'#2A3411','#73662C','#BC9847','#FFDFB2','6B0031',
'#637D74','#403D3A','#8C3B3B','#AB6937','D4A960',
'#010A26','#011640','#B6D6F2','#FFFFFF','E83338',
'#924847','#EB986C','#E4C678','#9C7885','372C2C',
'#022440','#3F95AA','#4EC6DE','#EAE2DF','F7572F',
'#2B1D2E','#323657','#076473','#54B087','D6F567',
'#052229','#004043','#BCC373','#E3FF55','D0D90C',
'#4C514A','#907A62','#879796','#755854','B09880',
'#1D2939','#1CAF9A','#FFFFFF','#EE4F4B','D1DC48',
'#004B67','#41CCB4','#FFEA95','#FF7C5D','C70151',
'#C0272D','#FCFBE7','#9FD3DA','#008C9A','05484F',
'#213130','#FF5E3D','#C9C83E','#FDFFF1','559398',
'#B1E4FC','#366D78','#39D5F1','#FFFFFF','D9FF03',
'#DECE6C','#FCF9B6','#BFE3B5','#5D826E','262E2B',
'#520A17','#668F91','#F5E6AC','#AB8E5B','52301C',
'#2D3032','#DD5F18','#FBA922','#F7F7F7','404333',
'#0C2538','#2B434F','#638270','#BCC98E','EDE059',
'#E85066','#F28E76','#E6CEB0','#5A8C81','382837',
'#BF2633','#A6242F','#D9CEAD','#C0B18F','011C26',
'#002A4A','#17607D','#FFF1CE','#FF9311','E33200',
'#0A8B91','#485956','#C4B98F','#FFF9BC','EEDF2E',
'#B89A7B','#9BBAAC','#F2D649','#D95D50','DBDBDB',
'#BD7938','#8D4421','#643001','#532700','3A1C00',
'#E1E6FA','#C4D7ED','#ABC8E2','#375D81','183152',
'#2E4259','#F7483B','#ECF0F1','#03C8FA','737373',
'#364656','#5D6B74','#94A4A5','#F2F5E9','FF8C31',
'#3E5916','#93A605','#F28705','#F25C05','E5EFFA',
'#248077','#74AD8D','#C82754','#F7BB21','F9E2B7',
'#20736A','#8BD9CA','#B1D95B','#93A651','403E34',
'#D74B4B','#DCDDD8','#475F77','#354B5E','FFFFFF',
'#252F33','#415C4F','#869C80','#93C2CC','CEEAEE',
'#012840','#79C7D9','#9BF2EA','#497358','9DBF8E',
'#EE7E94','#F8B4C4','#C7CAC9','#D8505C','41424',
'#282828','#505050','#FFFFFF','#2DCEDB','F20000',
'#004358','#1F8A70','#BEDB39','#FF5347','FD7400',
'#470C3B','#802F56','#C0576F','#E38679','FFBD83',
'#573328','#B05A3A','#FF8548','#29332E','0F1B1C',
'#461F2D','#E1FFBB','#BAD47F','#849C23','52533F',
'#333A40','#4C5E5E','#ADD0E5','#CDE4FF','729EBF',
'#DE5605','#F7A035','#B1DEB5','#EFECCA','65ABA6',
'#76D6D2','#F9E270','#EF6F56','#F4EED8','596B56',
'#403E3F','#F2F2F2','#D9D9D9','#9DAABB','8C8C8C',
'#059E9A','#F4F2ED','#F5A243','#DB3E3B','585857',
'#FFBF41','#EE8943','#C02221','#FFF4D3','249CA9',
'#024E76','#39A6B2','#FCE138','#F5B824','F08106',
'#FF0067','#FF3D6A','#E7FF04','#9CFF00','56FF00',
'#003540','#0D3F40','#487360','#8FA671','F2D795',
'#FF493C','#FFFFFF','#B3ECEF','#31C4F5','ADEB41',
'#244358','#4A8B87','#7CBCAE','#F0D4AF','C5252B',
'#EA5930','#F8AF1E','#F5E5C0','#097380','372560',
'#A1DBB2','#FEE5AD','#FACA66','#F7A541','F45D4C',
'#2C4A47','#6C9A7F','#BB523D','#C89D11','81810B',
'#F0F1F2','#232625','#647362','#FF5629','D2D9B8',
'#7C9B5F','#B8D197','#E3FFF3','#9BDEC7','568F84',
'#E54E45','#DBC390','#F2F2EF','#13A3A5','403833',
'#77A7FB','#E57368','#FBCB43','#34B67A','FFFFFF',
'#001A2E','#8F0000','#FFFFFF','#8A874B','41594F',
'#312F40','#49A69C','#EFEAC5','#E89063','BF5656',
'#047C8C','#018B8D','#F3BF81','#F49B78','F1706D',
'#00303E','#7096AD','#C1D1DE','#FFF9EF','EC4911',
'#2D6891','#70A0BF','#F5EEDC','#DC4C1A','F0986C',
'#040002','#3D1309','#E8B96A','#BC5D15','5C0F00',
'#8B929C','#5E6070','#514454','#3B313D','FF2479',
'#142D58','#447F6E','#E1B65B','#C8782A','9E3E17',
'#22104D','#2D1E5E','#483A85','#7067AB','A49CFA',
'#919C86','#9E373E','#2B2E36','#D1B993','C45A3B',
'#332F45','#015770','#2A8782','#9FD6AE','FFFED2',
'#37C78F','#FEE293','#FF4D38','#CC2249','380C2A',
'#47282C','#8C8468','#C9B37F','#DBDAB7','C4C49C',
'#14191A','#2D2B21','#A69055','#CCB287','FFB88C',
'#F5E3CD','#696158','#B6A898','#877D71','504A43',
'#005151','#009393','#F56200','#454445','969692',
'#D95F47','#FFF2C1','#80A894','#106153','072C36',
'#9E352C','#E6E8A9','#93C28C','#2E5A5C','2B2623',
'#03013A','#334A94','#6B9EDF','#83C3F2','99E6FF',
'#372A26','#4D4D4D','#6DA0A7','#9ED5A8','C7F5FF',
'#03658C','#022E40','#F2B705','#F28705','F25C05',
'#FF3B16','#E87826','#E8BA4A','#80A272','003045',
'#00748E','#E3DFBB','#F4BA4D','#E3753C','DA3B3A',
'#25401E','#56732C','#84A63C','#B8D943','EAF2AC',
'#449BB5','#043D5D','#EB5055','#68C39F','FFFCF5',
'#108F97','#FF8B6B','#FFE39F','#16866D','103636',
'#1A4F63','#068F86','#6FD57F','#FCB03C','FC5B3F',
'#381C19','#472E29','#948658','#F0E99A','362E29',
'#D7E8F7','#BBD0E3','#9CB7CF','#6A8BAB','375D81',
'#0F1C28','#136972','#67BFA7','#F3CF5B','F07444',
'#FFFFFF','#4EA9A0','#969514','#FE9C03','FCDE8E',
'#2F2D30','#656566','#65537A','#51386E','2A2333',
'#4C2916','#F05A28','#FBAF3F','#38B449','FFFFFF',
'#132537','#006C80','#EBCAB8','#FE8315','FA3113',
'#ECEEE1','#A8DACF','#F05B4F','#D8403A','221E1F',
'#00305A','#004B8C','#0074D9','#4192D9','7ABAF2',
'#72CF3F','#85FF00','#23E000','#2FB81B','00FF1C',
'#45CEEF','#FFF5A5','#FFD4DA','#99D2E4','D8CAB4',
'#FF5B00','#A1716C','#728296','#439AAB','00CABD',
'#EB6C2D','#D9C8A2','#939C80','#496158','232F38',
'#D94214','#FFF2C1','#80A894','#52736B','093844',
'#4D1B2F','#9E332E','#EB6528','#FC9D1C','FFCA50',
'#FFEEB0','#9AE8A4','#C7C12D','#F76245','ED1C43',
'#FFFAED','#D4DBFF','#879AC9','#242942','FF8800',
'#022840','#013440','#517360','#9DA67C','F2DC99',
'#331A0F','#519994','#BA4B3C','#EEDDAA','789F63',
'#577867','#EDCE82','#D68644','#AB3229','662845',
'#435A66','#88A6AF','#F5F2EB','#D9CDB8','424342',
'#FF8840','#958D4F','#737B55','#595540','513E38',
'#9D805A','#EBC99D','#FFE6C5','#9DCEEA','4B809E',
'#272D40','#364659','#55736D','#9DBF8E','D0D991',
'#23A38F','#B7C11E','#EFF1C2','#F0563D','2E313D',
'#98C000','#3D4C53','#EA2E49','#FFE11A','0CDBE8',
'#A20E30','#E93C4F','#DCDCD4','#ADBCC3','2D4255',
'#1C2640','#263357','#384C80','#4E6AB3','5979CD',
'#D94214','#FFF2C1','#80A894','#52736B','093844',
'#3B596A','#427676','#3F9A82','#A1CD73','ECDB60',
'#1E1E1F','#424143','#67666A','#807F83','CBC9CF',
'#E04946','#3BA686','#B6D15D','#FFD495','FA847E',
'#FFEBB0','#FFB05A','#F84322','#C33A1A','9F3818',
'#FFA136','#FF814A','#E6635A','#785D6B','534557',
'#CDCF91','#EBEACC','#D6D5B8','#6D7D80','41545E',
'#011526','#011C40','#4E8DA6','#F2EA79','F2B33D',
'#353230','#3F4E51','#7B8F70','#99B2BE','F6F4EA',
'#063559','#0D8C7F','#8FBF4D','#F2D13E','D95929',
'#158000','#199900','#20BF00','#24D900','29FF00',
'#0B0D0E','#137074','#7EB7A3','#F1DDBB','EC6766',
'#02151A','#043A47','#087891','#C8C8C8','B31D14',
'#59361F','#5C992E','#A3CC52','#E6E673','FF5933',
'#FE4365','#FC9D9A','#F9CDAD','#C8C8A9','83AF9B',
'#4B1E18','#F9E5C2','#BBB082','#829993','4F5D4E',
'#032843','#1F595B','#508C6D','#71A670','A6DB89',
'#191724','#4C4547','#8C594E','#D18952','FDB157',
'#191919','#182828','#60702D','#AAB232','E6FA87',
'#212A3F','#434F5B','#F2F2F2','#8AB839','2E2E2E',
'#004158','#026675','#038B8B','#F1EEC9','F09979',
'#023059','#3F7EA6','#F2F2F2','#D99E32','BF5E0A',
'#F21E52','#FFFFFF','#3D3B42','#0C6F73','63CFD4',
'#452743','#E7635E','#F8E9A8','#89E0AD','00928C',
'#FAAD63','#D1714D','#785E48','#39403B','3D1C24',
'#4C0016','#FFF7EB','#DCCEA7','#A17345','104F53',
'#BF2431','#F24150','#2A4557','#3B848C','EFF2E4',
'#3B3013','#8F6031','#E88833','#9C0C0A','FDF3C1',
'#1E2422','#88BEB1','#FF006D','#DAFFFF','718A94',
'#F1F4F7','#AF9F7B','#775E43','#40413C','251C17',
'#00182E','#0C6BA1','#D4D6D4','#FFFDEB','FF7500',
'#FFAB4A','#CCBAAB','#1E2129','#3D5E6E','47A3A3',
'#66B3A7','#C0D4B6','#EEF0BD','#F0563D','2C2F3B',
'#332525','#907465','#EDC5B5','#878C6D','63674A',
'#F04C16','#DBDBD0','#EDBD1F','#4CB09C','313B4A',
'#2B211D','#611C26','#C5003E','#8EB7A8','F1E4B7',
'#1A1F2B','#30395C','#4A6491','#85A5CC','D0E4F2',
'#03497E','#0596D5','#9DEBFC','#999999','FE4B28',
'#2F4159','#465E73','#88A649','#F2ECE4','D98841',
'#323A46','#22282F','#EB4A33','#FFFFFF','E9F0F5',
'#2C3E50','#FC4349','#6DBCDB','#D7DADB','FFFFFF',
'#F29727','#E05723','#B0382F','#982E4B','713045',
'#4D584A','#465943','#428552','#3E754E','4C694B',
'#47191C','#59574B','#829690','#B5B09A','E1E3CB',
'#1D5123','#B1C661','#FFDA68','#FE9257','F64448',
'#59323C','#260126','#F2EEB3','#BFAF80','8C6954',
'#4E0805','#9E0522','#FFF4D4','#B8C591','447622',
'#424862','#FB9A63','#BFC4D5','#F6FBF4','FEBC98',
'#FF2468','#E0D4B1','#FFFFE3','#00A5A6','005B63',
'#1C2F40','#4C6173','#8094A6','#D9D1BA','F2E9D8',
'#DFD7B7','#EB7707','#5C5445','#3B2323','9CBFC7',
'#262E3B','#9C8878','#CFCAAA','#FBF8FF','992435',
'#FFBC67','#DA727E','#AC6C82','#685C79','455C7B',
'#404A69','#516C8A','#8AC0DE','#FFFFFF','FFAC00',
'#485B61','#4B8C74','#74C476','#A4E66D','CFFC83',
'#A31180','#C42795','#DE52B4','#EA88CE','FFBFE5',
'#E64D2E','#FFF5F1','#7893AD','#576B9C','2D2A52',
'#BF0436','#8C0327','#590219','#F2CBA1','8C674C',
'#CF5B6F','#FFF8C8','#CAD9B1','#8FB3A0','648991',
'#341D44','#744D90','#BB8CDD','#3E4417','88904D',
'#00293E','#003D4E','#006269','#00918F','00BAB5',
'#43212E','#D9666F','#F2D57E','#A9A688','516057',
'#2A3B30','#ABFFD1','#EBFFF5','#9DFEFF','273B40',
'#A63343','#E65159','#F5E9DB','#F4F7CF','BAD984',
'#1BA68C','#54BFAC','#F2EDA7','#F2E530','D94625',
'#1A2A40','#3F7369','#F2DEA0','#CE5251','EA895E',
'#1E9382','#70A758','#EFF1C2','#F0563D','2E313D',
'#A991E8','#FFB4BB','#ACF7FF','#A2E891','FFEDAE',
'#225B66','#17A3A5','#8DBF67','#FCCB5F','FC6E59',
'#282624','#BFB7AA','#403D39','#807A71','ABA398',
'#334D5C','#45B29D','#EFC94C','#E27A3F','DF4949',
'#440008','#605521','#988432','#D9A54E','9E3711',
'#649670','#36291E','#69AD6C','#92E67C','C5FF84',
'#42342C','#738076','#B2B39B','#DFE5E1','294359',
'#1A3838','#3F7A51','#82A352','#D1C062','FFBE59',
'#7D8C22','#B3BF67','#F2E49B','#D9DFF4','6791BF',
'#8A7D6D','#2D2D38','#E86E48','#FFFFE8','9CC9C9',
'#CFC949','#FFF5BF','#A9E6C4','#6AB39F','665841',
'#A1172D','#FDFFBA','#A7DB9E','#275C57','1F1B19',
'#FF6C0D','#F29E00','#E6C10F','#44996F','216273',
'#2C3E50','#FA4248','#D7DADB','#6DBCDB','FFFFFF',
'#627369','#99B397','#E2F2C6','#91CCAD','376266',
'#04496E','#66CAFF','#A3FC7E','#70D44A','2C6B0F',
'#1BA68C','#97BF3F','#F2ECD8','#F2B035','F2522E',
'#A2D9B1','#7CBF9E','#F2F1B9','#8C8575','193741',
'#024959','#037E8C','#F2EFDC','#E74C30','363636',
'#212625','#9CA6A2','#D0D9D6','#BF0404','C2C6AF',
'#00FFFF','#00FF00','#FFFF00','#FF5100','FF007C',
'#212629','#CDCF19','#FFF77D','#96C4AB','CF2A56',
'#CFF9FF','#BFC7BB','#787051','#332730','57324F',
'#98CACB','#FDEFBE','#F0542B','#736E5B','ABA68E',
'#F2F1EB','#BFB9A4','#262222','#802A30','8C0303',
'#65356B','#AB434F','#C76347','#FFA24C','519183',
'#78BF82','#A4D17C','#CFD96C','#EBD464','FFD970',
'#806265','#FFA256','#F7DD77','#E0D054','ABA73C',
'#8F323C','#123943','#80BDDB','#4189AB','C98127',
'#683820','#8C9A89','#E7D6A2','#BEAA65','9A8234',
'#021B21','#032C36','#065F73','#E8DFD6','FF2A1D',
'#2D6C73','#3FA693','#B4D9CB','#9ABF49','C6D93B',
'#141F26','#2B4040','#405950','#A69E86','F2D9BB',
'#4A8279','#003330','#610400','#003B06','02730F',
'#69B5E1','#D4E4F5','#EAF2F8','#BEDBED','000000',
'#893660','#EF7261','#68D693','#A0D7E2','299CA8',
'#073A59','#2D9AA6','#F2E2DC','#F23322','A61B1B',
'#2A3A48','#3E6372','#B2D4DC','#FAFAFF','FF6900',
'#F3BD8D','#F1A280','#BE6D6B','#704A5B','3E263C',
'#1C2742','#3C91C7','#5A9ABE','#95C5DE','E0EEFB',
'#426261','#465A59','#577573','#739A97','9AC1C0',
'#002A4A','#17607D','#FFF1CE','#FF9311','D64700',
'#589373','#BFBD99','#F2D6B3','#C2512F','241E1E',
'#1F518B','#1488C8','#F7E041','#E2413E','B5292A',
'#549494','#E85649','#232C2E','#E6E8D2','706558',
'#392133','#FFECBE','#D9D098','#C4AB6D','AB7D3A',
'#F0F0F0','#1C1C1C','#A2FDF5','#1CCDC7','27EDDF',
'#011526','#025959','#027353','#03A678','03A696',
'#004358','#1F8A70','#BEDB39','#FFE11A','FD7400',
'#37465D','#F2F2F2','#9DC02E','#779324','051A37',
'#580022','#AA2C30','#FFBE8D','#487B80','011D24',
'#F9F9F9','#03A678','#E9EDEB','#F44647','00707F',
'#800000','#BF0000','#E2D6C2','#F6EDD8','FFFFFF',
'#F7F6AF','#1B2124','#D62822','#97D6A6','468263',
'#432852','#992255','#FF3D4C','#28656E','00968F',
'#444344','#52BBB2','#2B344D','#EE5555','F8F7EE',
'#45334A','#796B7D','#CCC4B0','#FFF1B5','FFA3A3',
'#5A4B53','#9C3C58','#DE2B5B','#D86A41','D2A825',
'#14151C','#0C242B','#297059','#84D66E','D1FB7A',
'#272D40','#364659','#55736D','#9DBF8E','D0D991',
'#23A38F','#B7C11E','#EFF1C2','#F0563D','2E313D',
'#2E064D','#80176B','#B356A1','#59580B','FFFF00',
'#CC3333','#FF9D33','#F7F7F0','#3EBBA7','00747A',
'#5C4B51','#8CBEB2','#F2EBBF','#F3B562','BD6060',
'#0D3E58','#1C848C','#19C0C2','#F3EDD6','DA6260',
'#022629','#2A5945','#FAFFED','#E6DCC0','B3371C',
'#F4FAC7','#7BAD8D','#FFB159','#F77F45','C2454E',
'#A2C1C6','#86B1B7','#AECBAD','#CFDCB0','D6E1D1',
'#B0DAFF','#325B80','#64B7FF','#586D80','5092CC',
'#0F808C','#6C8C26','#F2A71B','#F26A1B','D91818',
'#FFBC6C','#FE9F6C','#BD716E','#74495F','3B2C4D',
'#FF4D41','#F2931F','#E6CA21','#91B321','1E8C65',
'#302821','#453629','#5C4837','#8A735F','BDA895',
'#415457','#5F7B7F','#9ACCAF','#E6EBC4','F9F7C8',
'#474143','#A69E9D','#E7E2DA','#FFFFFF','E7E8E7',
'#805939','#BD9962','#E6CD7D','#578072','2D4B4D',
'#03588C','#1763A6','#419CA6','#54BF83','8DBF41',
'#00CCFF','#A1FCFF','#040438','#004878','C9FAFF',
'#534C64','#B7DECF','#F0F3D7','#7E858C','D96557',
'#7F7364','#CBB08E','#CBC1B7','#789DCB','646F7F',
'#5C2849','#A73E5C','#EC7263','#FE9551','FFD285',
'#FF0012','#FF7D00','#FFD900','#5BE300','0084B0',
'#F24C32','#F29471','#FCDFA6','#36B898','3D7585',
'#083157','#0A6C87','#459C97','#92CCA5','C9F0B1',
'#DC941B','#EDC266','#B6952C','#E1D3A6','E9A119',
'#323836','#BAD1B5','#DBE8CF','#F0F7E8','FFFEF5',
'#081724','#589494','#8EBBB4','#D0DCD0','F5EED2',
'#50781C','#9CAD1C','#EAF7E6','#40A5DE','0B5191',
'#537F79','#78A68F','#CBD49C','#FED457','CB252A',
'#F23C13','#CBAB78','#FFFFFF','#898373','1F1C17',
'#450003','#5C0002','#94090D','#D40D12','FFED75',
'#0770A2','#82D9F7','#FEFEFE','#AEC844','F36622',
'#30394F','#FF434C','#6ACEEB','#EDE8DF','0E6569',
'#FF6B6B','#556270','#C7F464','#4ECDC4','EDC8BB',
'#D9B500','#FFED9C','#BFCC85','#748F74','454545',
'#452E32','#A34B1B','#B5A187','#EDDF9A','A7CC31',
'#2C2B33','#596664','#909980','#CCC08D','FF8A00',
'#C21F1F','#FFFFFC','#E34446','#FFFFDB','E36D6F',
'#282828','#00AAB5','#C1C923','#F41C54','F5F0F0',
'#3A3F40','#202627','#151B1E','#EFF4FF','41444D',
'#DEBB73','#4D0017','#010000','#4D0F30','9A002F',
'#EB9328','#FFA754','#FFD699','#FFF5DC','4FA6B3',
'#025E73','#037F8C','#D9D59A','#D9BD6A','590202',
'#636266','#E0CEA4','#E8A579','#7D6855','42403E',
'#FF0000','#FF4000','#FF7F00','#FFBF00','FFFF00',
'#FFFFFF','#74ADA6','#1E5E6F','#241B1F','68A81E',
'#5A0532','#FF6745','#FFC861','#9DAE64','27404A',
'#ACCBBC','#467847','#E8E4C1','#A60303','730202',
'#5C4B51','#8CBEB2','#F2EBBF','#F3B562','F06060',
'#0D2557','#93A8C9','#FFFFFF','#F5DED5','558D96',
'#F53C4A','#565157','#10CFC8','#F2EEE7','F5D662',
'#FFD97B','#E65029','#A60027','#660033','191C26',
'#595408','#A6800D','#A66D03','#A63F03','730C02',
'#2E031F','#590424','#8C072B','#BF0A2B','DEEFC5',
'#E0C882','#A6874E','#BFA169','#D9B779','F2D399',
'#D88681','#A67673','#746566','#535A5D','324F54',
'#FC297D','#FB607A','#FDA286','#FDC188','FEE78A',
'#FFECA1','#B3B27F','#4C5E52','#2F3436','FFBE2C',
'#D93312','#B3AB82','#45735F','#394D47','2C3233',
'#324143','#6595A3','#C8E3E8','#FCFFED','B6C28B',
'#477984','#FEF5EB','#C03C44','#EEAA4D','313E4A',
'#334D5C','#45B29D','#EFC94C','#E27A3F','DF4949',
'#630B11','#33322F','#2A2927','#1E1D1C','000000',
'#D94214','#FFF2C1','#80A894','#52736B','093844',
'#051E21','#00302D','#856434','#F28C28','FFAD4E',
'#D7DADD','#DDDEE3','#E1E1E9','#EDEFF4','F2F3F8',
'#BF495E','#41A693','#F2EC9B','#D9CF48','D9583B',
'#067072','#14A589','#DECFA6','#BAAE8C','F94B06',
'#423A38','#47B8C8','#E7EEE2','#BDB9B1','D7503E',
'#730324','#DFE3E6','#B4C4D4','#8BA2BD','456382',
'#537374','#F9BD7F','#EBD7A5','#ADC9A5','5C9E99',
'#88B59E','#B6DEC8','#39464D','#C04229','ABD1AB',
'#11A7FC','#95D127','#F2E415','#FF8638','EE3551',
'#212640','#5D718C','#4B95A6','#60BFBF','EFF2D8',
'#D8A64D','#9B5422','#351411','#5B0D0D','991C11',
'#53324F','#668D6E','#F2E0A0','#F19B7A','F0756E',
'#DFE0AF','#A4BAA2','#569492','#41505E','383245',
'#7BBADE','#93DE7F','#FFED5D','#F29E4A','FF7050',
'#133800','#1B4F1B','#398133','#5C9548','93E036',
'#D9D7AD','#91A685','#FF6A00','#37485C','1C232E',
'#008767','#FFB27A','#FF6145','#AB2141','5E1638',
'#727B7F','#CCEAEA','#7A7556','#2E2125','44CACC',
'#FFFFED','#FF2C38','#FF9A3A','#FFF040','67D9FF',
'#007148','#60A859','#9BDA6A','#C7F774','F9FFEF',
'#092740','#45698B','#90B0CC','#F1FAFF','8FD36F',
'#E2FFA0','#7D8076','#FAFFED','#C2CCBE','8F7D70',
'#00736A','#00BC9F','#F1EEC7','#FEA301','F2561A',
'#26282E','#AD5138','#F7F7F7','#DDDAE0','8594AE',
'#1A191F','#35352F','#484042','#4E5252','E64D38',
'#49454A','#E69B02','#FAF4C6','#B1D631','324052',
'#5F1A2B','#1D2834','#6F8B78','#E4D49E','C96466',
'#012D3D','#38AD9E','#FFEB9E','#FF6867','D0DBED',
'#0D1F36','#104954','#1E9C89','#38CC85','60EB7B',
'#8C4E03','#9FA66A','#F2EC94','#F23005','8B0F03',
'#000001','#20201F','#E2E2E4','#590402','B80000',
'#344059','#465973','#F2D272','#A69460','595139',
'#33454C','#608F85','#B6E5CB','#8BAF95','54584E',
'#FBFEF6','#B7BFA4','#687F70','#1A3841','BF3847',
'#D7E836','#86FFC7','#FFB048','#E8366C','593BFF',
'#34A9FF','#5982DB','#665EB8','#684682','632E62',
'#004056','#2C858D','#74CEB7','#C9FFD5','FFFFCB',
'#BFB978','#84945C','#516967','#4D3130','281B24',
'#103B73','#20638C','#3786A6','#4EABBF','EBEFF2',
'#9FB1BF','#1D2D63','#1C5357','#1F6E56','196331',
'#FFEBBA','#C3BD91','#88947B','#4C3F3F','2A2727',
'#347373','#4EA6A6','#91D9D9','#FFFFFD','F2E205',
'#828948','#EFDFC2','#006971','#DC533E','840000',
'#000137','#29003F','#79003D','#D04D14','F89801',
'#370005','#4B0005','#5F0005','#730005','870005',
'#C3AE8D','#F25260','#2D5F73','#6BADC9','8FCED6',
'#9E1B36','#F7EDBA','#E69B3D','#EB3355','3D241D',
'#1D8281','#44BF87','#FBD258','#F29A3F','DB634F',
'#035C75','#1B808C','#31A6A8','#F3F1BC','F3AD14',
'#FF7500','#665130','#EBB643','#CEDAA8','668E84',
'#384D3A','#3E6653','#728053','#A68357','D97C71',
'#012326','#17455C','#E1CAAB','#FE8333','FA4913',
'#1A2944','#2DA7C7','#56ACBA','#98C4C9','CBD5D2',
'#BF3542','#CDC5BA','#EBE3D6','#3C3C3C','2E2E2E',
'#231921','#695F74','#BEB4CB','#EBEBF0','D2DCEB',
'#34373F','#686C75','#F3E9D0','#BEB7A7','8E867C',
'#661510','#D9351A','#F2C76F','#BF9727','204D3F',
'#3CFFEE','#24AABC','#356781','#2C3D51','1C1F24',
'#DA3537','#FFFCC4','#00585F','#6A6A61','2A2C2B',
'#AE3135','#D1AF87','#8C826B','#3D3C33','F2F0CE',
'#FF0894','#FF5E9F','#FF91A7','#FFB5CA','F5F0BA',
'#99878D','#323232','#646464','#7E4A5C','372129',
'#3FB8AF','#7FC7AF','#DAD8A7','#FFB38B','FF3F34',
'#402B3C','#6AA6A6','#D9CCA7','#F2B263','F26835',
'#6AA690','#F2BC1B','#F2DC99','#F29057','BF1F1F',
'#F4FAC7','#7BAD8D','#FFB158','#F77F45','C2454E',
'#E5533C','#F5E346','#93D06D','#50AC6A','227864',
'#39588A','#A9BDD7','#FFFFFF','#FFEADD','FFD0BB',
'#B0B595','#615F4F','#828567','#91A380','EAFFCD',
'#00427F','#0066BD','#66B5CC','#F0E4C5','D6C28F',
'#FF6313','#F9E4B3','#C29689','#74474B','45232E',
'#00585F','#009393','#FFFCC4','#C7C49B','EB0A00',
'#091840','#44A2FF','#F7F7EA','#B3CC63','4C6620',
'#5CBBE3','#FCF1BC','#5C8182','#383A47','B4F257',
'#9E9E9E','#E5E1D1','#E0393D','#253746','425563',
'#4D9453','#FFFFB1','#ADDE4E','#FF9D27','A62A16',
'#B70046','#FF850B','#FFEBC5','#109679','675A4C',
'#363636','#0599B0','#A4BD0A','#FFA615','FF2E00',
'#7D8077','#BBBFB2','#FAFFED','#E82A33','E3DEBC',
'#FD9F44','#FC5C65','#007269','#03A679','FAF0B9',
'#134B57','#81A489','#F1D8B5','#F2A054','C04D31',
'#946E49','#394042','#EDDBAC','#872A0C','BA8E3A',
'#404040','#024959','#037E8C','#FFFFFF','F24C27',
'#2A3342','#163C6E','#4E5F61','#E6A015','EDE7BE',
'#445060','#829AB5','#849E91','#C14543','D6D5D1',
'#8A9126','#B7BF5E','#FFE9C4','#F5B776','F58E45',
'#9B2D1E','#3C3A28','#78A080','#9BCD9E','FFFFAE',
'#FF6138','#FFFF9D','#BEEB9F','#79BD8F','00A388',
'#990000','#FF6600','#FF9900','#996633','CC9966',
'#DCE6DA','#B8CCBB','#98B3A5','#7A9994','62858C',
'#0B1C29','#3B7C8F','#73A5A3','#98C1B7','F0EBD2',
'#F6CB51','#E25942','#13A89E','#3F4953','F2E7DA',
'#282F36','#FFFEFC','#BDA21D','#BFBC5B','D2E098',
'#8C182D','#DE7140','#FCB95A','#FAE285','6A7349',
'#6B9100','#FFE433','#FF841F','#E03D19','A6001C',
'#FFEAA7','#D9D697','#9FC49F','#718C6A','543122',
'#CFF09E','#A8DBA8','#79BD9A','#3B8686','0B486B',
'#0C2233','#065471','#0A91AB','#FFC045','F2F2F2',
'#BEE8E0','#373C40','#2E2621','#73320B','FF5E00',
'#1B2C35','#A3BFC6','#FF005D','#222A30','293A42',
'#FF8400','#3B4044','#494948','#E6E1D8','F7F2E9',
'#6A482D','#518C86','#F6BF3D','#EF7C27','BF2424',
'#261C2B','#292B39','#226468','#608D80','829D8F',
'#B2AD9A','#110E00','#363226','#A9A695','ECE9D8',
'#1B1B26','#26394D','#286480','#13B3BF','A3FF57',
'#F2C2A7','#F5E5C5','#593D28','#422C21','93DEDB',
'#001028','#033140','#1E5A5B','#7BA78C','EBEDC6',
'#544E6E','#808CB0','#ABD1D9','#D9FFF7','DDF556',
'#323A45','#596677','#758194','#FFFFFF','E74C3C',
'#45291A','#AB926D','#DBD1BC','#4999C3','5FCBEC',
'#6B151D','#2E1615','#A8553A','#DB8F5A','F2C18E',
'#000623','#28475C','#4A6C74','#8BA693','F0E3B1',
'#60807B','#81B37A','#BCCC5F','#FFEE65','E64964',
'#FFFFFA','#A1A194','#5B605F','#464646','FF6600',
'#1E1B17','#577270','#9C9A79','#C7BDA1','580E0C',
'#452F27','#5E504A','#6B6865','#9BBAB2','B0FFED',
'#1B5257','#F7F6C3','#F28159','#CC5850','4F1C2E',
'#FAA51B','#BF511F','#2C445E','#2F6D82','5EE4EB',
'#BF3952','#59364A','#556D73','#D9D1A9','D95F5F',
'#024959','#037E8C','#F2EFDC','#E74C30','363636',
'#221A26','#544759','#A197A6','#F27405','D93D04',
'#C4A44A','#E6D399','#9AB8A9','#7C8A7F','4E4B44',
'#FFFEC8','#B1BF99','#5B604D','#39382B','26181E',
'#4E3C51','#21A68D','#3BBF9A','#F2E8B6','F25749',
'#102144','#1B325E','#254580','#3C63B0','5D8AEA',
'#2A3A48','#3E6372','#B2D4DC','#FAFAFF','FF4B00',
'#FFF1BF','#F20058','#FFAEAC','#000001','7D7A96',
'#FDFFC6','#F2F096','#FF0080','#DE0049','521218',
'#5B0E00','#FBB500','#FBD864','#807D1A','59233C',
'#1E1E1F','#424143','#67666A','#807F83','CBC9CF',
'#3C3658','#3EC8B7','#7CD0B4','#B9D8B1','F7E0AE',
'#FFFFFF','#99B75F','#D5DD98','#EBF4DB','D8D8D8',
'#248A8A','#C9FA58','#F9E555','#FAAC38','F2572A',
'#086B63','#77A490','#E2D8C1','#BFAE95','7C7159',
'#5C4B51','#8CBEB2','#F2EBBF','#A5C88F','EF847B',
'#17162F','#89346D','#C76058','#FFB248','E8C475',
'#6E8F4A','#65D9C5','#F2E7B6','#EDA430','AB3E2C',
'#30394F','#FF434C','#6ACEEB','#EDE8DF','0E6569',
'#8E1B13','#F9E4B3','#849689','#46464A','29232E',
'#686B30','#AB9A52','#E8BA67','#D68F4F','BA512E',
'#E54E45','#DBC390','#F2F2EF','#13A3A5','403833',
'#65BA99','#59A386','#F1DDBB','#D6C4A6','E74C3C',
'#A6FFBC','#4ACFAF','#00A995','#006161','003D4C',
'#33271E','#8B7653','#C8D9A0','#FDEE9D','233331',
'#048789','#503D2E','#D44D27','#E2A72E','EFEBC8',
'#E5FF1E','#A9D943','#75A660','#698070','494D4B',
'#2DEBA2','#91F57F','#EBAA69','#E70049','2B0027',
'#990000','#336699','#DDDDDD','#999999','333333',
'#F13A4B','#3D3C3E','#22BDAF','#F4F4F4','D7D7D7',
'#F53A59','#001D2D','#15A88C','#B7D9C8','F3F5F4',];



buildTexture();

};

Ops.Color.ColorPalettes.prototype = new CABLES.Op();
CABLES.OPS["31d33a1e-9a0a-49f7-8bc8-9e83ab71e23e"]={f:Ops.Color.ColorPalettes,objName:"Ops.Color.ColorPalettes"};




// **************************************************************
// 
// Ops.Value.Boolean
// 
// **************************************************************

Ops.Value.Boolean = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const v=op.inValueBool("value",false);
const result=op.outValueBool("result");

result.set(false);
v.onChange=exec;

function exec()
{
    if(result.get()!=v.get()) result.set(v.get());
}



};

Ops.Value.Boolean.prototype = new CABLES.Op();
CABLES.OPS["83e2d74c-9741-41aa-a4d7-1bda4ef55fb3"]={f:Ops.Value.Boolean,objName:"Ops.Value.Boolean"};




// **************************************************************
// 
// Ops.Devices.TouchScreen
// 
// **************************************************************

Ops.Devices.TouchScreen = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    disableScaleWeb=op.inValueBool("Disable Scaling",true),
    disableDefault=op.inValueBool("Disable Scroll",true),
    hdpi=op.inValueBool("HDPI Coordinates",false),
    active=op.inValueBool("Active",true),

    outTouched=op.outValue("Touched",false),
    numFingers=op.outValue("Fingers",0),

    f1x=op.outValue("Finger 1 X",0),
    f1y=op.outValue("Finger 1 Y",0),
    f1f=op.outValue("Finger 1 Force",0),

    f2x=op.outValue("Finger 2 X",0),
    f2y=op.outValue("Finger 2 Y",0),
    area=op.inSwitch("Area",['Canvas','Document'],'Canvas'),

    outEvents=op.outArray("Events"),
    normalize=op.inValueBool("Normalize Coordinates"),
    flipY=op.inValueBool("Flip Y"),
    outTouchStart=op.outTrigger("Touch Start"),
    outTouchEnd=op.outTrigger("Touch End");


area.onChange=updateArea;

function setPos(event)
{
    if(event.touches && event.touches.length>0)
    {
        var rect = event.target.getBoundingClientRect();
        var x = event.touches[0].clientX - event.touches[0].target.offsetLeft;
        var y = event.touches[0].clientY - event.touches[0].target.offsetTop;

        if(flipY.get()) y=rect.height-y;

        if(hdpi.get())
        {
            x*=(op.patch.cgl.pixelDensity||1);
            y*=(op.patch.cgl.pixelDensity||1);
        }

        if(normalize.get())
        {
            x=(x/rect.width*2.0-1.0);
            y=(y/rect.height*2.0-1.0);
        }

        f1x.set(x);
        f1y.set(y);

        if(event.touches[0].force)f1f.set(event.touches[0].force);
    }

    if(event.touches && event.touches.length>1)
    {
        var rect = event.target.getBoundingClientRect();
        var x = event.touches[1].clientX - event.touches[1].target.offsetLeft;
        var y = event.touches[1].clientY - event.touches[1].target.offsetTop;

        if(hdpi.get())
        {
            x*=(op.patch.cgl.pixelDensity||1);
            y*=(op.patch.cgl.pixelDensity||1);
        }

        f2x.set(x);
        f2y.set(y);
    }
    outEvents.set(event.touches);

}

var ontouchstart=function(event)
{
    outTouched.set(true);
    setPos(event);
    numFingers.set(event.touches.length);
    outTouchStart.trigger();
};

var ontouchend=function(event)
{
    outTouched.set(false);
    f1f.set(0);
    setPos(event);

    numFingers.set(event.touches.length);
    outTouchEnd.trigger();
};

var ontouchmove=function(event)
{
    setPos(event);
    numFingers.set(event.touches.length);
    if(disableDefault.get() || (disableScaleWeb.get() && event.scale !== 1))
    {
        event.preventDefault();
    }
};


var cgl=op.patch.cgl;
var listenerElement=null;
function addListeners()
{
    listenerElement.addEventListener('touchmove', ontouchmove);
    listenerElement.addEventListener('touchstart', ontouchstart);
    listenerElement.addEventListener('touchend', ontouchend);

    // console.log("added touchscreen listeners",listenerElement);
}

function updateArea()
{
    removeListeners();

    if(area.get()=='Document') listenerElement = document;
    else listenerElement = cgl.canvas;

    if(active.get()) addListeners();
}

function removeListeners()
{
    if(listenerElement)
    {
        listenerElement.removeEventListener('touchmove', ontouchmove);
        listenerElement.removeEventListener('touchstart', ontouchstart);
        listenerElement.removeEventListener('touchend', ontouchend);
    }
    // console.log("removed touchscreen listeners");
    listenerElement=null;

}

active.onChange=function()
{
    updateArea();
};

updateArea();



};

Ops.Devices.TouchScreen.prototype = new CABLES.Op();
CABLES.OPS["cedffacf-0f09-4342-bd21-540bd9c8037d"]={f:Ops.Devices.TouchScreen,objName:"Ops.Devices.TouchScreen"};




// **************************************************************
// 
// Ops.Math.Compare.GreaterOrEquals
// 
// **************************************************************

Ops.Math.Compare.GreaterOrEquals = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    result=op.outValue("result"),
    number1=op.inValueFloat("number1"),
    number2=op.inValueFloat("number2");

number1.onLinkChanged=
    number2.onLinkChanged=
    number1.onChange=
    number2.onChange=exec;

function exec()
{
    result.set(number1.get()>=number2.get());
}



};

Ops.Math.Compare.GreaterOrEquals.prototype = new CABLES.Op();
CABLES.OPS["5f9ce320-1e8d-49cb-9927-337e0b3f4d45"]={f:Ops.Math.Compare.GreaterOrEquals,objName:"Ops.Math.Compare.GreaterOrEquals"};




// **************************************************************
// 
// Ops.Boolean.IfTrueThen
// 
// **************************************************************

Ops.Boolean.IfTrueThen = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe=op.inTrigger("exe"),
    boolean=op.inValueBool("boolean",false),
    triggerThen=op.outTrigger("then"),
    triggerElse=op.outTrigger("else");

boolean.onChange=execBool;
exe.onTriggered=exec;

function execBool()
{
    if(exe.isLinked())return;
    exec();
}

function exec()
{
    if(boolean.get() || boolean.get()>=1 ) triggerThen.trigger();
        else triggerElse.trigger();
}



};

Ops.Boolean.IfTrueThen.prototype = new CABLES.Op();
CABLES.OPS["99892fda-8821-4660-ac57-3103d1546924"]={f:Ops.Boolean.IfTrueThen,objName:"Ops.Boolean.IfTrueThen"};




// **************************************************************
// 
// Ops.Math.Sum
// 
// **************************************************************

Ops.Math.Sum = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    number1=op.inValueFloat("number1",1),
    number2=op.inValueFloat("number2",1),
    result=op.outValue("result");

number1.onChange=
number2.onChange=exec;
exec();

function exec()
{
    var v=number1.get()+number2.get();
    if(!isNaN(v)) result.set( v );
}



};

Ops.Math.Sum.prototype = new CABLES.Op();
CABLES.OPS["c8fb181e-0b03-4b41-9e55-06b6267bc634"]={f:Ops.Math.Sum,objName:"Ops.Math.Sum"};




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
// Ops.WebAudio.Output
// 
// **************************************************************

Ops.WebAudio.Output = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
op.requirements=[CABLES.Requirements.WEBAUDIO];

var audioCtx = CABLES.WEBAUDIO.createAudioContext(op);

// constants
var VOLUME_DEFAULT = 1.0;
var VOLUME_MIN = 0;
var VOLUME_MAX = 1;

// vars
var gainNode = audioCtx.createGain();
var destinationNode = audioCtx.destination;
gainNode.connect(destinationNode);
var masterVolume = 1;

// inputs
var audioInPort = CABLES.WEBAUDIO.createAudioInPort(op, "Audio In", gainNode);
var volumePort = op.inValueSlider("Volume", VOLUME_DEFAULT);
var mutePort = op.inValueBool("Mute", false);

// functions
// sets the volume, multiplied by master volume
function setVolume() {
    var volume = volumePort.get() * masterVolume;
    if(volume >= VOLUME_MIN && volume <= VOLUME_MAX) {
        // gainNode.gain.value = volume;
        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    } else {
        // gainNode.gain.value = VOLUME_DEFAULT * masterVolume;
        gainNode.gain.setValueAtTime(VOLUME_DEFAULT * masterVolume, audioCtx.currentTime);
    }
}

function mute(b) {
    if(b) {
        // gainNode.gain.value = 0;
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    } else {
        setVolume();
    }
}

// change listeners
mutePort.onChange = function() {
    mute(mutePort.get());
};

volumePort.onChange = function() {
    if(mutePort.get()) {
        return;
    }
    setVolume();
};

op.onMasterVolumeChanged = function(v) {
    masterVolume = v;
    setVolume();
};




};

Ops.WebAudio.Output.prototype = new CABLES.Op();
CABLES.OPS["53fdbf4a-bc8d-4c5d-a698-f34fdeb53827"]={f:Ops.WebAudio.Output,objName:"Ops.WebAudio.Output"};




// **************************************************************
// 
// Ops.WebAudio.AudioBufferPlayer
// 
// **************************************************************

Ops.WebAudio.AudioBufferPlayer = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var audioCtx = CABLES.WEBAUDIO.createAudioContext(op);

// input ports
var audioBufferPort = op.inObject("Audio Buffer");
var playPort = op.inValueBool("Start / Stop", false);
var startTimePort = op.inValue("Start Time", 0);
var stopTimePort = op.inValue("Stop Time", 0);
var offsetPort = op.inValue("Offset", 0);
var autoPlayPort = op.inValueBool("Autoplay", false);
var loopPort = op.inValueBool("Loop", false);
var detunePort = op.inValue("Detune", 0);
var playbackRatePort = op.inValue("Playback Rate", 1);

// output ports
var audioOutPort = op.outObject("Audio Out");

// vars
var source = null;

// change listeners
audioBufferPort.onChange = function() {
    createAudioBufferSource();
    if(
        (autoPlayPort.get() && audioBufferPort.get()) ||
    (playPort.get() && audioBufferPort.get())
    ) {
        start(startTimePort.get());
    }
};
playPort.onChange = function() {
    if(source) {
        if(playPort.get()) {
            var startTime = startTimePort.get() || 0;
            start(startTime);    
        } else {
            var stopTime = stopTimePort.get() || 0;
            stop(stopTime);    
        } 
    }
};
loopPort.onChange = function() {
    if(source) {
        source.loop = loopPort.get() ? true : false;
    }
};

detunePort.onChange = setDetune;

function setDetune() {
    if(source) {
        var detune = detunePort.get() || 0;
        if(source.detune) {
            source.detune.setValueAtTime(
                detune,
                audioCtx.currentTime    
            );
        }
    }
}

playbackRatePort.onChange = setPlaybackRate;

function setPlaybackRate() {
    if(source) {
        var playbackRate = playbackRatePort.get() || 0;
        if(playbackRate >= source.playbackRate.minValue && playbackRate <= source.playbackRate.maxValue) {
            source.playbackRate.setValueAtTime(
                playbackRate,
                audioCtx.currentTime    
            );    
        }
    }
}

// functions
function createAudioBufferSource() {
    if(source)stop(0);
    source = audioCtx.createBufferSource();
    var buffer = audioBufferPort.get();
    if(buffer) {
        source.buffer = buffer;
    }
    source.onended = onPlaybackEnded;
    source.loop = loopPort.get();
    setPlaybackRate();
    setDetune();
    audioOutPort.set(source);
}

function start(time) {
    try {
        source.start(time,offsetPort.get()); // 0 = now
    } catch(e){
        // console.log(e);
    } // already playing!?
}

function stop(time) {
    try {
        source.stop(time); // 0 = now
    } catch(e) 
    {
        // console.log(e);
    } // not playing!?
}

function onPlaybackEnded() {
    createAudioBufferSource(); // we can only play back once, so we need to create a new one
}

};

Ops.WebAudio.AudioBufferPlayer.prototype = new CABLES.Op();
CABLES.OPS["05385277-92fc-4d49-b730-11f9ed5e5c0d"]={f:Ops.WebAudio.AudioBufferPlayer,objName:"Ops.WebAudio.AudioBufferPlayer"};




// **************************************************************
// 
// Ops.WebAudio.AudioBuffer
// 
// **************************************************************

Ops.WebAudio.AudioBuffer = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const audioCtx = CABLES.WEBAUDIO.createAudioContext(op);
const inUrlPort = op.inFile("URL",'audio');
const audioBufferPort = op.outObject("Audio Buffer");
const finishedLoadingPort = op.outValue("Finished Loading", false);
const sampleRatePort = op.outValue("Sample Rate", 0);
const lengthPort = op.outValue("Length", 0);
const durationPort = op.outValue("Duration", 0);
const numberOfChannelsPort = op.outValue("Number of Channels", 0);

// change listeners
inUrlPort.onChange = function() {
    var url=op.patch.getFilePath(inUrlPort.get());
    if(typeof url === 'string' && url.length > 1) {
        CABLES.WEBAUDIO.loadAudioFile(op.patch, url, onLoadFinished, onLoadFailed);
    }
};

function onLoadFinished(buffer) {
    lengthPort.set(buffer.length);
    durationPort.set(buffer.duration);
    numberOfChannelsPort.set(buffer.numberOfChannels);
    sampleRatePort.set(buffer.sampleRate);
    audioBufferPort.set(buffer);
    finishedLoadingPort.set(true);
    // op.log("AudioBuffer loaded: ", buffer);
}

function onLoadFailed(e) {
    op.error("Error: Loading audio file failed: ", e);
    invalidateOutPorts();
}

function invalidateOutPorts() {
    lengthPort.set(0);
    durationPort.set(0);
    numberOfChannelsPort.set(0);
    sampleRatePort.set(0);
    audioBufferPort.set(0);
    finishedLoadingPort.set(false);
}

};

Ops.WebAudio.AudioBuffer.prototype = new CABLES.Op();
CABLES.OPS["2cf4b0a1-b657-405b-8bf9-8555dbd5c231"]={f:Ops.WebAudio.AudioBuffer,objName:"Ops.WebAudio.AudioBuffer"};




// **************************************************************
// 
// Ops.Sidebar.Slider
// 
// **************************************************************

Ops.Sidebar.Slider = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
// constants
const STEP_DEFAULT = 0.00001;

// inputs
const parentPort = op.inObject('link');
const labelPort = op.inValueString('Text', 'Slider');
const minPort = op.inValue("Min", 0);
const maxPort = op.inValue("Max", 1);
const stepPort = op.inValue("Step", STEP_DEFAULT);

const inGreyOut=op.inBool("Grey Out",false);
const inVisible=op.inBool("Visible",true);

const inputValuePort = op.inValue('Input', 0.5);
const setDefaultValueButtonPort = op.inTriggerButton('Set Default');
const reset = op.inTriggerButton('Reset');

const defaultValuePort = op.inValue('Default', 0.5);
defaultValuePort.setUiAttribs({ hidePort: true, greyout: true });

// outputs
const siblingsPort = op.outObject('childs');
const valuePort = op.outValue('Result', defaultValuePort.get());

op.toWorkNeedsParent('Ops.Sidebar.Sidebar');
op.setPortGroup("Range",[minPort,maxPort,stepPort]);
op.setPortGroup("Visibility",[inGreyOut,inVisible]);

// vars
var el = document.createElement('div');
el.classList.add('sidebar__item');
el.classList.add('sidebar__slider');
var label = document.createElement('div');
label.classList.add('sidebar__item-label');

var greyOut = document.createElement('div');
greyOut.classList.add('sidebar__greyout');
el.appendChild(greyOut);
greyOut.style.display="none";

var labelText = document.createTextNode(labelPort.get());
label.appendChild(labelText);
el.appendChild(label);

var value = document.createElement('input');
value.value = defaultValuePort.get();
value.classList.add('sidebar__text-input-input');
// value.setAttribute('type', 'number'); /* not possible to use '.' instead of ',' as separator on German computer, so not usable... */
value.setAttribute('type', 'text');
// value.setAttribute('lang', 'en-US'); // force '.' as decimal separator
// value.setAttribute('pattern', '[0-9]+([\.][0-9]+)?'); // only allow '.' as separator
// value.setAttribute('step', 'any'); /* we cannot use the slider step, as it restricts valid numbers to be entered */
// value.setAttribute('formnovalidate', '');
value.oninput = onTextInputChanged;
el.appendChild(value);

var inputWrapper = document.createElement('div');
inputWrapper.classList.add('sidebar__slider-input-wrapper');
el.appendChild(inputWrapper);


var activeTrack = document.createElement('div');
activeTrack.classList.add('sidebar__slider-input-active-track');
inputWrapper.appendChild(activeTrack);
var input = document.createElement('input');
input.classList.add('sidebar__slider-input');
input.setAttribute('min', minPort.get());
input.setAttribute('max', maxPort.get());
input.setAttribute('type', 'range');
input.setAttribute('step', stepPort.get());
input.setAttribute('value', defaultValuePort.get());
input.style.display = 'block'; /* needed because offsetWidth returns 0 otherwise */
inputWrapper.appendChild(input);


updateActiveTrack();
input.addEventListener('input', onSliderInput);

// events
parentPort.onChange = onParentChanged;
labelPort.onChange = onLabelTextChanged;
inputValuePort.onChange = onInputValuePortChanged;
defaultValuePort.onChange = onDefaultValueChanged;
setDefaultValueButtonPort.onTriggered = onSetDefaultValueButtonPress;
minPort.onChange = onMinPortChange;
maxPort.onChange = onMaxPortChange;
stepPort.onChange = stepPortChanged;
op.onDelete = onDelete;

// op.onLoadedValueSet=function()
op.onLoaded=op.onInit=function()
{
    if(op.patch.config.sidebar)
    {
        op.patch.config.sidebar[labelPort.get()];
        valuePort.set(op.patch.config.sidebar[labelPort.get()]);
    }
    else
    {
        valuePort.set(parseFloat(defaultValuePort.get()));
        inputValuePort.set(parseFloat(defaultValuePort.get()));
        // onInputValuePortChanged();
    }
};

reset.onTriggered=function()
{
    const newValue=parseFloat(defaultValuePort.get());
    valuePort.set(newValue);
    value.value = newValue;
    input.value = newValue;
    inputValuePort.set(newValue);
    // console.log(newValue);
    updateActiveTrack();
};

inGreyOut.onChange=function()
{
    greyOut.style.display= inGreyOut.get() ? "block" : "none";
};

inVisible.onChange=function()
{
    el.style.display= inVisible.get() ? "block" : "none";
};

function onTextInputChanged(ev) {
    let newValue = parseFloat(ev.target.value);
    if(isNaN(newValue)) newValue = 0;
    const min = minPort.get();
    const max = maxPort.get();
    if(newValue < min) { newValue = min; }
    else if(newValue > max) { newValue = max; }
    // input.value = newValue;
    valuePort.set(newValue);
    updateActiveTrack();
    inputValuePort.set(newValue);
    if(op.isCurrentUiOp()) gui.patch().showOpParams(op); /* update DOM */
}

function onInputValuePortChanged() {
    let newValue = parseFloat(inputValuePort.get());
    const minValue = minPort.get();
    const maxValue = maxPort.get();
    if(newValue > maxValue) { newValue = maxValue; }
    else if(newValue < minValue) { newValue = minValue; }
    value.value = newValue;
    input.value = newValue;
    valuePort.set(newValue);
    updateActiveTrack();
}

function onSetDefaultValueButtonPress()
{
    let newValue = parseFloat(inputValuePort.get());
    const minValue = minPort.get();
    const maxValue = maxPort.get();
    if(newValue > maxValue) { newValue = maxValue; }
    else if(newValue < minValue) { newValue = minValue; }
    value.value = newValue;
    input.value = newValue;
    valuePort.set(newValue);
    defaultValuePort.set(newValue);
    if(op.isCurrentUiOp()) gui.patch().showOpParams(op); /* update DOM */

    updateActiveTrack();
}

function onSliderInput(ev)
{
    ev.preventDefault();
    ev.stopPropagation();
    value.value = ev.target.value;
    const inputFloat = parseFloat(ev.target.value);
    valuePort.set(inputFloat);
    inputValuePort.set(inputFloat);
    if(op.isCurrentUiOp()) gui.patch().showOpParams(op); /* update DOM */

    updateActiveTrack();
    return false;
}

function stepPortChanged()
{
    var step = stepPort.get();
    input.setAttribute('step', step);
    updateActiveTrack();
}

function updateActiveTrack(val)
{
    let valueToUse = parseFloat(input.value);
    if(typeof val !== 'undefined') valueToUse = val;
    let availableWidth = input.offsetWidth; /* this returns 0 at the beginning... */
    if(availableWidth === 0) { availableWidth = 206; }
    var trackWidth = CABLES.map(
        valueToUse,
        parseFloat(input.min),
        parseFloat(input.max),
        0,
        availableWidth - 16 /* subtract slider thumb width */
    );
    // activeTrack.style.width = 'calc(' + percentage + '%' + ' - 9px)';
    activeTrack.style.width = trackWidth + 'px';
}

function onMinPortChange() {
    var min = minPort.get();
    input.setAttribute('min', min);
    updateActiveTrack();
}

function onMaxPortChange() {
    var max = maxPort.get();
    input.setAttribute('max', max);
    updateActiveTrack();
}

function onDefaultValueChanged() {
    var defaultValue = defaultValuePort.get();
    valuePort.set(parseFloat(defaultValue));
    onMinPortChange();
    onMaxPortChange();
    input.value = defaultValue;
    value.value = defaultValue;

    updateActiveTrack(defaultValue); // needs to be passed as argument, is this async?
}

function onLabelTextChanged()
{
    var labelText = labelPort.get();
    label.textContent = labelText;
    if(CABLES.UI) op.setTitle('Slider: ' + labelText);
}

function onParentChanged()
{
    var parent = parentPort.get();
    if(parent && parent.parentElement)
    {
        parent.parentElement.appendChild(el);
        siblingsPort.set(null);
        siblingsPort.set(parent);
    } else if(el.parentElement) el.parentElement.removeChild(el);
}

function showElement(el) {
    if(el)el.style.display = 'block';
}

function hideElement(el) {
    if(el)el.style.display = 'none';
}

function onDelete() {
    removeElementFromDOM(el);
}

function removeElementFromDOM(el) {
    if(el && el.parentNode && el.parentNode.removeChild) el.parentNode.removeChild(el);
}


};

Ops.Sidebar.Slider.prototype = new CABLES.Op();
CABLES.OPS["eb3232e5-e947-4683-a17f-27a72d464b2c"]={f:Ops.Sidebar.Slider,objName:"Ops.Sidebar.Slider"};




// **************************************************************
// 
// Ops.Sidebar.Sidebar
// 
// **************************************************************

Ops.Sidebar.Sidebar = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={style_css:"/*\n * SIDEBAR\n  http://danielstern.ca/range.css/#/\n  https://developer.mozilla.org/en-US/docs/Web/CSS/::-webkit-progress-value\n */\n\n\n.icon-chevron-down {\n    top: 2px;\n    right: 9px;\n}\n\n.iconsidebar-chevron-up {\n\tbackground-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4ODg4ODgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLWNoZXZyb24tdXAiPjxwb2x5bGluZSBwb2ludHM9IjE4IDE1IDEyIDkgNiAxNSI+PC9wb2x5bGluZT48L3N2Zz4=);\n    top: 2px;\n    right: 9px;\n}\n\n.sidebar-cables-right\n{\n    right: 0px;\n    left: initial !important;\n}\n\n.sidebar-cables {\n    position: absolute;\n    top: 15px;\n    left: 15px;\n    border-radius: 10px;\n    /*border:10px solid #1a1a1a;*/\n    z-index: 100000;\n    color: #BBBBBB;\n    width: 220px;\n    max-height: 100%;\n    box-sizing: border-box;\n    overflow-y: auto;\n    overflow-x: hidden;\n    font-size: 13px;\n    font-family: Arial;\n    line-height: 1em; /* prevent emojis from breaking height of the title */\n    --sidebar-border-radius: 4px;\n    --sidebar-monospace-font-stack: \"SFMono-Regular\", Consolas, \"Liberation Mono\", Menlo, Courier, monospace;\n    --sidebar-hover-transition-time: .2s;\n}\n\n.sidebar-cables::selection {\n    background-color: #24baa7;\n    color: #EEEEEE;\n}\n\n.sidebar-cables::-webkit-scrollbar {\n    background-color: transparent;\n    --cables-scrollbar-width: 8px;\n    width: var(--cables-scrollbar-width);\n}\n\n.sidebar-cables::-webkit-scrollbar-track {\n    background-color: transparent;\n    width: var(--cables-scrollbar-width);\n}\n\n.sidebar-cables::-webkit-scrollbar-thumb {\n    background-color: #333333;\n    border-radius: 4px;\n    width: var(--cables-scrollbar-width);\n}\n\n.sidebar-cables--closed {\n    width: auto;\n}\n\n.sidebar__close-button {\n    background-color: #222;\n    -webkit-user-select: none;  /* Chrome all / Safari all */\n    -moz-user-select: none;     /* Firefox all */\n    -ms-user-select: none;      /* IE 10+ */\n    user-select: none;          /* Likely future */\n    transition: background-color var(--sidebar-hover-transition-time);\n    color: #CCCCCC;\n    height: 12px;\n    box-sizing: border-box;\n    padding-top: 2px;\n    text-align: center;\n    cursor: pointer;\n    /*border-top: 1px solid #272727;*/\n    border-radius: 0 0 var(--sidebar-border-radius) var(--sidebar-border-radius);\n    opacity: 1.0;\n    transition: opacity 0.3s;\n    overflow: hidden;\n}\n\n.sidebar__close-button-icon {\n    display: inline-block;\n    /*opacity: 0;*/\n    width: 21px;\n    height: 20px;\n    position: relative;\n    top: -1px;\n    /*background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4ODg4ODgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLWNoZXZyb24tdXAiPjxwb2x5bGluZSBwb2ludHM9IjE4IDE1IDEyIDkgNiAxNSI+PC9wb2x5bGluZT48L3N2Zz4=);*/\n    /*background-size: cover;*/\n    /*background-repeat: no-repeat;*/\n    /*background-repeat: no-repeat;*/\n    /*background-position: 0 -1px;*/\n}\n\n.sidebar--closed .sidebar__close-button {\n    margin-top: 8px;\n    margin-left: 8px;\n    padding-top: 13px;\n    padding-left: 11px;\n    padding-right: 11px;\n    width: 46px;\n    height: 46px;\n    border-radius: 50%;\n    cursor: pointer;\n    opacity: 0.3;\n}\n\n.sidebar--closed .sidebar__group\n{\n    display:none;\n\n}\n.sidebar--closed .sidebar__close-button-icon {\n    background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIHdpZHRoPSIyMnB4IiBoZWlnaHQ9IjE3cHgiIHZpZXdCb3g9IjAgMCAyMiAxNyIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj4gICAgICAgIDx0aXRsZT5Hcm91cCAzPC90aXRsZT4gICAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+ICAgIDxkZWZzPjwvZGVmcz4gICAgPGcgaWQ9IkNhbnZhcy1TaWRlYmFyIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4gICAgICAgIDxnIGlkPSJEZXNrdG9wLWdyZWVuLWJsdWlzaC1Db3B5LTkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yMC4wMDAwMDAsIC0yMi4wMDAwMDApIj4gICAgICAgICAgICA8ZyBpZD0iR3JvdXAtMyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjAuMDAwMDAwLCAyMi4wMDAwMDApIj4gICAgICAgICAgICAgICAgPHBhdGggZD0iTTAuNSwyLjUgTDIuNSwyLjUiIGlkPSJMaW5lLTIiIHN0cm9rZT0iIzk3OTc5NyIgc3Ryb2tlLWxpbmVjYXA9InNxdWFyZSI+PC9wYXRoPiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTAuNSwyLjUgTDIxLjUsMi41IiBpZD0iTGluZS0yIiBzdHJva2U9IiM5Nzk3OTciIHN0cm9rZS1saW5lY2FwPSJzcXVhcmUiPjwvcGF0aD4gICAgICAgICAgICAgICAgPHBhdGggZD0iTTAuNSw4LjUgTDExLjUsOC41IiBpZD0iTGluZS0yIiBzdHJva2U9IiM5Nzk3OTciIHN0cm9rZS1saW5lY2FwPSJzcXVhcmUiPjwvcGF0aD4gICAgICAgICAgICAgICAgPHBhdGggZD0iTTE5LjUsOC41IEwyMS41LDguNSIgaWQ9IkxpbmUtMiIgc3Ryb2tlPSIjOTc5Nzk3IiBzdHJva2UtbGluZWNhcD0ic3F1YXJlIj48L3BhdGg+ICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0wLjUsMTQuNSBMNS41LDE0LjUiIGlkPSJMaW5lLTIiIHN0cm9rZT0iIzk3OTc5NyIgc3Ryb2tlLWxpbmVjYXA9InNxdWFyZSI+PC9wYXRoPiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTMuNSwxNC41IEwyMS41LDE0LjUiIGlkPSJMaW5lLTIiIHN0cm9rZT0iIzk3OTc5NyIgc3Ryb2tlLWxpbmVjYXA9InNxdWFyZSI+PC9wYXRoPiAgICAgICAgICAgICAgICA8Y2lyY2xlIGlkPSJPdmFsLTMiIGZpbGw9IiM5Nzk3OTciIGN4PSI2LjUiIGN5PSIyLjUiIHI9IjIuNSI+PC9jaXJjbGU+ICAgICAgICAgICAgICAgIDxjaXJjbGUgaWQ9Ik92YWwtMyIgZmlsbD0iIzk3OTc5NyIgY3g9IjE1LjUiIGN5PSI4LjUiIHI9IjIuNSI+PC9jaXJjbGU+ICAgICAgICAgICAgICAgIDxjaXJjbGUgaWQ9Ik92YWwtMyIgZmlsbD0iIzk3OTc5NyIgY3g9IjkuNSIgY3k9IjE0LjUiIHI9IjIuNSI+PC9jaXJjbGU+ICAgICAgICAgICAgPC9nPiAgICAgICAgPC9nPiAgICA8L2c+PC9zdmc+);\n    background-position: 0px 0px;\n}\n\n.sidebar__close-button:hover {\n    background-color: #111111;\n    opacity: 1.0 !important;\n}\n\n/*\n * SIDEBAR ITEMS\n */\n\n.sidebar__items {\n    /* max-height: 1000px; */\n    /* transition: max-height 0.5;*/\n    background-color: #222;\n}\n\n.sidebar--closed .sidebar__items {\n    /* max-height: 0; */\n    height: 0;\n    display: none;\n    pointer-interactions: none;\n}\n\n.sidebar__item__right {\n    float: right;\n}\n\n/*\n * SIDEBAR GROUP\n */\n\n.sidebar__group {\n    /*background-color: #1A1A1A;*/\n    overflow: hidden;\n    box-sizing: border-box;\n    animate: height;\n    /* max-height: 1000px; */\n    /* transition: max-height 0.5s; */\n    --sidebar-group-header-height: 28px;\n}\n\n.sidebar__group--closed {\n    /* max-height: 13px; */\n    height: var(--sidebar-group-header-height);\n}\n\n.sidebar__group-header {\n    box-sizing: border-box;\n    color: #EEEEEE;\n    background-color: #151515;\n    -webkit-user-select: none;  /* Chrome all / Safari all */\n    -moz-user-select: none;     /* Firefox all */\n    -ms-user-select: none;      /* IE 10+ */\n    user-select: none;          /* Likely future */\n    height: var(--sidebar-group-header-height);\n    padding-top: 7px;\n    text-transform: uppercase;\n    letter-spacing: 0.08em;\n    cursor: pointer;\n    transition: background-color var(--sidebar-hover-transition-time);\n    position: relative;\n}\n\n.sidebar__group-header:hover {\n  background-color: #111111;\n}\n\n.sidebar__group-header-title {\n  /*text-align: center;*/\n  overflow: hidden;\n  padding: 0 15px;\n  padding-top:2px;\n  font-weight:bold;\n}\n\n.sidebar__group-header-icon {\n    width: 17px;\n    height: 14px;\n    background-repeat: no-repeat;\n    display: inline-block;\n    position: absolute;\n    background-size: cover;\n\n    /* icon open */\n    /* feather icon: chevron up */\n    background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4ODg4ODgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLWNoZXZyb24tdXAiPjxwb2x5bGluZSBwb2ludHM9IjE4IDE1IDEyIDkgNiAxNSI+PC9wb2x5bGluZT48L3N2Zz4=);\n    top: 4px;\n    right: 5px;\n    opacity: 0.0;\n    transition: opacity 0.3;\n}\n\n.sidebar__group-header:hover .sidebar__group-header-icon {\n    opacity: 1.0;\n}\n\n/* icon closed */\n.sidebar__group--closed .sidebar__group-header-icon {\n    /* feather icon: chevron down */\n    background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4ODg4ODgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLWNoZXZyb24tZG93biI+PHBvbHlsaW5lIHBvaW50cz0iNiA5IDEyIDE1IDE4IDkiPjwvcG9seWxpbmU+PC9zdmc+);\n    top: 4px;\n    right: 5px;\n}\n\n/*\n * SIDEBAR ITEM\n */\n\n.sidebar__item\n{\n    box-sizing: border-box;\n    padding: 7px;\n    padding-left:15px;\n    padding-right:15px;\n\n    overflow: hidden;\n    position: relative;\n}\n\n.sidebar__item-label {\n    display: inline-block;\n    -webkit-user-select: none;  /* Chrome all / Safari all */\n    -moz-user-select: none;     /* Firefox all */\n    -ms-user-select: none;      /* IE 10+ */\n    user-select: none;          /* Likely future */\n    width: calc(50% - 7px);\n    margin-right: 7px;\n    margin-top: 2px;\n    max-height: 1em;\n    text-overflow: ellipsis;\n    /* overflow: hidden; */\n}\n\n.sidebar__item-value-label {\n    font-family: var(--sidebar-monospace-font-stack);\n    display: inline-block;\n    text-overflow: ellipsis;\n    overflow: hidden;\n    white-space: nowrap;\n    max-width: 60%;\n}\n\n.sidebar__item-value-label::selection {\n    background-color: #24baa7;\n    color: #EEEEEE;\n}\n\n.sidebar__item + .sidebar__item,\n.sidebar__item + .sidebar__group,\n.sidebar__group + .sidebar__item,\n.sidebar__group + .sidebar__group {\n    border-top: 1px solid #272727;\n}\n\n/*\n * SIDEBAR ITEM TOGGLE\n */\n\n.sidebar__toggle {\n    cursor: pointer;\n}\n\n.sidebar__toggle-input {\n    --sidebar-toggle-input-color: #CCCCCC;\n    --sidebar-toggle-input-color-hover: #EEEEEE;\n    --sidebar-toggle-input-border-size: 2px;\n    display: inline;\n    float: right;\n    box-sizing: border-box;\n    border-radius: 50%;\n    cursor: pointer;\n    --toggle-size: 11px;\n    margin-top: 2px;\n    background-color: transparent !important;\n    border: var(--sidebar-toggle-input-border-size) solid var(--sidebar-toggle-input-color);\n    width: var(--toggle-size);\n    height: var(--toggle-size);\n    transition: background-color var(--sidebar-hover-transition-time);\n    transition: border-color var(--sidebar-hover-transition-time);\n}\n.sidebar__toggle:hover .sidebar__toggle-input {\n    border-color: var(--sidebar-toggle-input-color-hover);\n}\n\n.sidebar__toggle .sidebar__item-value-label {\n    -webkit-user-select: none;  /* Chrome all / Safari all */\n    -moz-user-select: none;     /* Firefox all */\n    -ms-user-select: none;      /* IE 10+ */\n    user-select: none;          /* Likely future */\n    max-width: calc(50% - 12px);\n}\n.sidebar__toggle-input::after { clear: both; }\n\n.sidebar__toggle--active .icon_toggle\n{\n\n    background-image: url(data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjE1cHgiIHdpZHRoPSIzMHB4IiBmaWxsPSIjMDZmNzhiIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMTAwIDEwMCIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PGcgZGlzcGxheT0ibm9uZSI+PGcgZGlzcGxheT0iaW5saW5lIj48Zz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZmlsbD0iIzA2Zjc4YiIgZD0iTTMwLDI3QzE3LjM1LDI3LDcsMzcuMzUsNyw1MGwwLDBjMCwxMi42NSwxMC4zNSwyMywyMywyM2g0MCBjMTIuNjUsMCwyMy0xMC4zNSwyMy0yM2wwLDBjMC0xMi42NS0xMC4zNS0yMy0yMy0yM0gzMHogTTcwLDY3Yy05LjM4OSwwLTE3LTcuNjEtMTctMTdzNy42MTEtMTcsMTctMTdzMTcsNy42MSwxNywxNyAgICAgUzc5LjM4OSw2Nyw3MCw2N3oiPjwvcGF0aD48L2c+PC9nPjwvZz48Zz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTMwLDI3QzE3LjM1LDI3LDcsMzcuMzUsNyw1MGwwLDBjMCwxMi42NSwxMC4zNSwyMywyMywyM2g0MCAgIGMxMi42NSwwLDIzLTEwLjM1LDIzLTIzbDAsMGMwLTEyLjY1LTEwLjM1LTIzLTIzLTIzSDMweiBNNzAsNjdjLTkuMzg5LDAtMTctNy42MS0xNy0xN3M3LjYxMS0xNywxNy0xN3MxNyw3LjYxLDE3LDE3ICAgUzc5LjM4OSw2Nyw3MCw2N3oiPjwvcGF0aD48L2c+PGcgZGlzcGxheT0ibm9uZSI+PGcgZGlzcGxheT0iaW5saW5lIj48cGF0aCBmaWxsPSIjMDZmNzhiIiBzdHJva2U9IiMwNmY3OGIiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBkPSJNNyw1MGMwLDEyLjY1LDEwLjM1LDIzLDIzLDIzaDQwICAgIGMxMi42NSwwLDIzLTEwLjM1LDIzLTIzbDAsMGMwLTEyLjY1LTEwLjM1LTIzLTIzLTIzSDMwQzE3LjM1LDI3LDcsMzcuMzUsNyw1MEw3LDUweiI+PC9wYXRoPjwvZz48Y2lyY2xlIGRpc3BsYXk9ImlubGluZSIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGZpbGw9IiMwNmY3OGIiIHN0cm9rZT0iIzA2Zjc4YiIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIGN4PSI3MCIgY3k9IjUwIiByPSIxNyI+PC9jaXJjbGU+PC9nPjxnIGRpc3BsYXk9Im5vbmUiPjxwYXRoIGRpc3BsYXk9ImlubGluZSIgZD0iTTcwLDI1SDMwQzE2LjIxNSwyNSw1LDM2LjIxNSw1LDUwczExLjIxNSwyNSwyNSwyNWg0MGMxMy43ODUsMCwyNS0xMS4yMTUsMjUtMjVTODMuNzg1LDI1LDcwLDI1eiBNNzAsNzEgICBIMzBDMTguNDIxLDcxLDksNjEuNTc5LDksNTBzOS40MjEtMjEsMjEtMjFoNDBjMTEuNTc5LDAsMjEsOS40MjEsMjEsMjFTODEuNTc5LDcxLDcwLDcxeiBNNzAsMzFjLTEwLjQ3NywwLTE5LDguNTIzLTE5LDE5ICAgczguNTIzLDE5LDE5LDE5czE5LTguNTIzLDE5LTE5UzgwLjQ3NywzMSw3MCwzMXogTTcwLDY1Yy04LjI3MSwwLTE1LTYuNzI5LTE1LTE1czYuNzI5LTE1LDE1LTE1czE1LDYuNzI5LDE1LDE1Uzc4LjI3MSw2NSw3MCw2NXoiPjwvcGF0aD48L2c+PC9zdmc+);\n    opacity: 1;\n    transform: rotate(0deg);\n}\n\n\n.icon_toggle\n{\n    float: right;\n    width:40px;\n    height:18px;\n    background-image: url(data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjE1cHgiIHdpZHRoPSIzMHB4IiBmaWxsPSIjYWFhYWFhIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMTAwIDEwMCIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PGcgZGlzcGxheT0ibm9uZSI+PGcgZGlzcGxheT0iaW5saW5lIj48Zz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZmlsbD0iI2FhYWFhYSIgZD0iTTMwLDI3QzE3LjM1LDI3LDcsMzcuMzUsNyw1MGwwLDBjMCwxMi42NSwxMC4zNSwyMywyMywyM2g0MCBjMTIuNjUsMCwyMy0xMC4zNSwyMy0yM2wwLDBjMC0xMi42NS0xMC4zNS0yMy0yMy0yM0gzMHogTTcwLDY3Yy05LjM4OSwwLTE3LTcuNjEtMTctMTdzNy42MTEtMTcsMTctMTdzMTcsNy42MSwxNywxNyAgICAgUzc5LjM4OSw2Nyw3MCw2N3oiPjwvcGF0aD48L2c+PC9nPjwvZz48Zz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTMwLDI3QzE3LjM1LDI3LDcsMzcuMzUsNyw1MGwwLDBjMCwxMi42NSwxMC4zNSwyMywyMywyM2g0MCAgIGMxMi42NSwwLDIzLTEwLjM1LDIzLTIzbDAsMGMwLTEyLjY1LTEwLjM1LTIzLTIzLTIzSDMweiBNNzAsNjdjLTkuMzg5LDAtMTctNy42MS0xNy0xN3M3LjYxMS0xNywxNy0xN3MxNyw3LjYxLDE3LDE3ICAgUzc5LjM4OSw2Nyw3MCw2N3oiPjwvcGF0aD48L2c+PGcgZGlzcGxheT0ibm9uZSI+PGcgZGlzcGxheT0iaW5saW5lIj48cGF0aCBmaWxsPSIjYWFhYWFhIiBzdHJva2U9IiNhYWFhYWEiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBkPSJNNyw1MGMwLDEyLjY1LDEwLjM1LDIzLDIzLDIzaDQwICAgIGMxMi42NSwwLDIzLTEwLjM1LDIzLTIzbDAsMGMwLTEyLjY1LTEwLjM1LTIzLTIzLTIzSDMwQzE3LjM1LDI3LDcsMzcuMzUsNyw1MEw3LDUweiI+PC9wYXRoPjwvZz48Y2lyY2xlIGRpc3BsYXk9ImlubGluZSIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGZpbGw9IiNhYWFhYWEiIHN0cm9rZT0iI2FhYWFhYSIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIGN4PSI3MCIgY3k9IjUwIiByPSIxNyI+PC9jaXJjbGU+PC9nPjxnIGRpc3BsYXk9Im5vbmUiPjxwYXRoIGRpc3BsYXk9ImlubGluZSIgZD0iTTcwLDI1SDMwQzE2LjIxNSwyNSw1LDM2LjIxNSw1LDUwczExLjIxNSwyNSwyNSwyNWg0MGMxMy43ODUsMCwyNS0xMS4yMTUsMjUtMjVTODMuNzg1LDI1LDcwLDI1eiBNNzAsNzEgICBIMzBDMTguNDIxLDcxLDksNjEuNTc5LDksNTBzOS40MjEtMjEsMjEtMjFoNDBjMTEuNTc5LDAsMjEsOS40MjEsMjEsMjFTODEuNTc5LDcxLDcwLDcxeiBNNzAsMzFjLTEwLjQ3NywwLTE5LDguNTIzLTE5LDE5ICAgczguNTIzLDE5LDE5LDE5czE5LTguNTIzLDE5LTE5UzgwLjQ3NywzMSw3MCwzMXogTTcwLDY1Yy04LjI3MSwwLTE1LTYuNzI5LTE1LTE1czYuNzI5LTE1LDE1LTE1czE1LDYuNzI5LDE1LDE1Uzc4LjI3MSw2NSw3MCw2NXoiPjwvcGF0aD48L2c+PC9zdmc+);\n    background-size: 50px 37px;\n    background-position: -6px -10px;\n    transform: rotate(180deg);\n    opacity: 0.4;\n}\n\n\n\n/*.sidebar__toggle--active .sidebar__toggle-input {*/\n/*    transition: background-color var(--sidebar-hover-transition-time);*/\n/*    background-color: var(--sidebar-toggle-input-color);*/\n/*}*/\n/*.sidebar__toggle--active .sidebar__toggle-input:hover*/\n/*{*/\n/*    background-color: var(--sidebar-toggle-input-color-hover);*/\n/*    border-color: var(--sidebar-toggle-input-color-hover);*/\n/*    transition: background-color var(--sidebar-hover-transition-time);*/\n/*    transition: border-color var(--sidebar-hover-transition-time);*/\n/*}*/\n\n/*\n * SIDEBAR ITEM BUTTON\n */\n\n.sidebar__button {}\n\n.sidebar__button-input {\n    -webkit-user-select: none;  /* Chrome all / Safari all */\n    -moz-user-select: none;     /* Firefox all */\n    -ms-user-select: none;      /* IE 10+ */\n    user-select: none;          /* Likely future */\n    height: 24px;\n    background-color: transparent;\n    color: #CCCCCC;\n    box-sizing: border-box;\n    padding-top: 3px;\n    text-align: center;\n    border-radius: 125px;\n    border:2px solid #555;\n    cursor: pointer;\n}\n\n.sidebar__button-input.plus, .sidebar__button-input.minus {\n    display: inline-block;\n    min-width: 20px;\n}\n\n.sidebar__button-input:hover {\n  background-color: #333;\n  border:2px solid #07f78c;\n}\n\n/*\n * VALUE DISPLAY (shows a value)\n */\n\n.sidebar__value-display {}\n\n/*\n * SLIDER\n */\n\n.sidebar__slider {\n    --sidebar-slider-input-height: 3px;\n}\n\n.sidebar__slider-input-wrapper {\n    width: 100%;\n    margin-top: 8px;\n    position: relative;\n}\n\n.sidebar__slider-input {\n    -webkit-appearance: none;\n    appearance: none;\n    margin: 0;\n    width: 100%;\n    height: var(--sidebar-slider-input-height);\n    background: #555;\n    cursor: pointer;\n    outline: 0;\n\n    -webkit-transition: .2s;\n    transition: background-color .2s;\n    border: none;\n}\n\n.sidebar__slider-input:focus, .sidebar__slider-input:hover {\n    border: none;\n}\n\n.sidebar__slider-input-active-track {\n    user-select: none;\n    position: absolute;\n    z-index: 11;\n    top: 0;\n    left: 0;\n    background-color: #07f78c;\n    pointer-events: none;\n    height: var(--sidebar-slider-input-height);\n\n    /* width: 10px; */\n}\n\n/* Mouse-over effects */\n.sidebar__slider-input:hover {\n    /*background-color: #444444;*/\n}\n\n/*.sidebar__slider-input::-webkit-progress-value {*/\n/*    background-color: green;*/\n/*    color:green;*/\n\n/*    }*/\n\n/* The slider handle (use -webkit- (Chrome, Opera, Safari, Edge) and -moz- (Firefox) to override default look) */\n\n.sidebar__slider-input::-moz-range-thumb\n{\n    position: absolute;\n    height: 15px;\n    width: 15px;\n    z-index: 900 !important;\n    border-radius: 20px !important;\n    cursor: pointer;\n    background: #07f78c !important;\n    user-select: none;\n\n}\n\n.sidebar__slider-input::-webkit-slider-thumb\n{\n    position: relative;\n    appearance: none;\n    -webkit-appearance: none;\n    user-select: none;\n    height: 15px;\n    width: 15px;\n    display: block;\n    z-index: 900 !important;\n    border: 0;\n    border-radius: 20px !important;\n    cursor: pointer;\n    background: #777 !important;\n}\n\n.sidebar__slider-input:hover ::-webkit-slider-thumb {\n    background-color: #EEEEEE !important;\n}\n\n/*.sidebar__slider-input::-moz-range-thumb {*/\n\n/*    width: 0 !important;*/\n/*    height: var(--sidebar-slider-input-height);*/\n/*    background: #EEEEEE;*/\n/*    cursor: pointer;*/\n/*    border-radius: 0 !important;*/\n/*    border: none;*/\n/*    outline: 0;*/\n/*    z-index: 100 !important;*/\n/*}*/\n\n.sidebar__slider-input::-moz-range-track {\n    background-color: transparent;\n    z-index: 11;\n}\n\n/*.sidebar__slider-input::-moz-range-thumb:hover {*/\n  /* background-color: #EEEEEE; */\n/*}*/\n\n\n/*.sidebar__slider-input-wrapper:hover .sidebar__slider-input-active-track {*/\n/*    background-color: #EEEEEE;*/\n/*}*/\n\n/*.sidebar__slider-input-wrapper:hover .sidebar__slider-input::-moz-range-thumb {*/\n/*    background-color: #fff !important;*/\n/*}*/\n\n/*.sidebar__slider-input-wrapper:hover .sidebar__slider-input::-webkit-slider-thumb {*/\n/*    background-color: #EEEEEE;*/\n/*}*/\n\n.sidebar__slider input[type=text] {\n    box-sizing: border-box;\n    /*background-color: #333333;*/\n    text-align: right;\n    color: #BBBBBB;\n    display: inline-block;\n    background-color: transparent !important;\n\n    width: 40%;\n    height: 18px;\n    outline: none;\n    border: none;\n    border-radius: 0;\n    padding: 0 0 0 4px !important;\n    margin: 0;\n}\n\n.sidebar__slider input[type=text]:active,\n.sidebar__slider input[type=text]:focus,\n.sidebar__slider input[type=text]:hover {\n\n    color: #EEEEEE;\n}\n\n/*\n * TEXT / DESCRIPTION\n */\n\n.sidebar__text .sidebar__item-label {\n    width: auto;\n    display: block;\n    max-height: none;\n    margin-right: 0;\n    line-height: 1.1em;\n}\n\n/*\n * SIDEBAR INPUT\n */\n.sidebar__text-input textarea,\n.sidebar__text-input input[type=text] {\n    box-sizing: border-box;\n    background-color: #333333;\n    color: #BBBBBB;\n    display: inline-block;\n    width: 50%;\n    height: 18px;\n    outline: none;\n    border: none;\n    border-radius: 0;\n    border:1px solid #666;\n    padding: 0 0 0 4px !important;\n    margin: 0;\n}\n\n.sidebar__color-picker .sidebar__item-label\n{\n    width:45%;\n}\n\n.sidebar__text-input textarea,\n.sidebar__text-input input[type=text]:active,\n.sidebar__text-input input[type=text]:focus,\n.sidebar__text-input input[type=text]:hover {\n    background-color: transparent;\n    color: #EEEEEE;\n}\n\n.sidebar__text-input textarea\n{\n    margin-top:10px;\n    height:60px;\n    width:100%;\n}\n\n/*\n * SIDEBAR SELECT\n */\n\n\n\n .sidebar__select {}\n .sidebar__select-select {\n    color: #BBBBBB;\n    /*-webkit-appearance: none;*/\n    /*-moz-appearance: none;*/\n    appearance: none;\n    /*box-sizing: border-box;*/\n    width: 50%;\n    height: 20px;\n    background-color: #333333;\n    /*background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4ODg4ODgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLWNoZXZyb24tZG93biI+PHBvbHlsaW5lIHBvaW50cz0iNiA5IDEyIDE1IDE4IDkiPjwvcG9seWxpbmU+PC9zdmc+);*/\n    background-repeat: no-repeat;\n    background-position: right center;\n    background-size: 16px 16px;\n    margin: 0;\n    /*padding: 0 2 2 6px;*/\n    border-radius: 5px;\n    border: 1px solid #777;\n    background-color: #444;\n    cursor: pointer;\n    outline: none;\n\n }\n\n.sidebar__select-select:hover,\n.sidebar__select-select:active,\n.sidebar__select-select:active {\n    background-color: #444444;\n    color: #EEEEEE;\n}\n\n/*\n * COLOR PICKER\n */\n\n .sidebar__color-picker-color-input {}\n\n .sidebar__color-picker input[type=text] {\n    box-sizing: border-box;\n    background-color: #333333;\n    color: #BBBBBB;\n    display: inline-block;\n    width: calc(50% - 21px); /* 50% minus space of picker circle */\n    height: 18px;\n    outline: none;\n    border: none;\n    border-radius: 0;\n    padding: 0 0 0 4px !important;\n    margin: 0;\n    margin-right: 7px;\n}\n\n.sidebar__color-picker input[type=text]:active,\n.sidebar__color-picker input[type=text]:focus,\n.sidebar__color-picker input[type=text]:hover {\n    background-color: #444444;\n    color: #EEEEEE;\n}\n\n.sidebar__color-picker input[type=color],\n.sidebar__palette-picker input[type=color] {\n    display: inline-block;\n    border-radius: 100%;\n    height: 14px;\n    width: 14px;\n    padding: 0;\n    border: none;\n    border-color: transparent;\n    outline: none;\n    background: none;\n    appearance: none;\n    -moz-appearance: none;\n    -webkit-appearance: none;\n    cursor: pointer;\n    position: relative;\n    top: 3px;\n}\n.sidebar__color-picker input[type=color]:focus,\n.sidebar__palette-picker input[type=color]:focus {\n    outline: none;\n}\n.sidebar__color-picker input[type=color]::-moz-color-swatch,\n.sidebar__palette-picker input[type=color]::-moz-color-swatch {\n    border: none;\n}\n.sidebar__color-picker input[type=color]::-webkit-color-swatch-wrapper,\n.sidebar__palette-picker input[type=color]::-webkit-color-swatch-wrapper {\n    padding: 0;\n}\n.sidebar__color-picker input[type=color]::-webkit-color-swatch,\n.sidebar__palette-picker input[type=color]::-webkit-color-swatch {\n    border: none;\n    border-radius: 100%;\n}\n\n/*\n * Palette Picker\n */\n.sidebar__palette-picker .sidebar__palette-picker-color-input.first {\n    margin-left: 0;\n}\n.sidebar__palette-picker .sidebar__palette-picker-color-input.last {\n    margin-right: 0;\n}\n.sidebar__palette-picker .sidebar__palette-picker-color-input {\n    margin: 0 4px;\n}\n\n.sidebar__palette-picker .circlebutton {\n    width: 14px;\n    height: 14px;\n    border-radius: 1em;\n    display: inline-block;\n    top: 3px;\n    position: relative;\n}\n\n/*\n * Preset\n */\n.sidebar__item-presets-preset\n{\n    padding:4px;\n    cursor:pointer;\n    padding-left:8px;\n    padding-right:8px;\n    margin-right:4px;\n    background-color:#444;\n}\n\n.sidebar__item-presets-preset:hover\n{\n    background-color:#666;\n}\n\n.sidebar__greyout\n{\n    background: #222;\n    opacity: 0.8;\n    width: 100%;\n    height: 100%;\n    position: absolute;\n    z-index: 1000;\n    right: 0;\n    top: 0;\n}\n",};
// vars
const CSS_ELEMENT_CLASS = 'cables-sidebar-style'; /* class for the style element to be generated */
const CSS_ELEMENT_DYNAMIC_CLASS = 'cables-sidebar-dynamic-style'; /* things which can be set via op-port, but not attached to the elements themselves, e.g. minimized opacity */
const SIDEBAR_CLASS = 'sidebar-cables';
const SIDEBAR_ID = 'sidebar'+CABLES.uuid();
const SIDEBAR_ITEMS_CLASS = 'sidebar__items';
const SIDEBAR_OPEN_CLOSE_BTN_CLASS = 'sidebar__close-button';
const SIDEBAR_OPEN_CLOSE_BTN_ICON_CLASS = 'sidebar__close-button-icon';
const BTN_TEXT_OPEN = ''; // 'Close';
const BTN_TEXT_CLOSED = ''; // 'Show Controls';

let openCloseBtn = null;
let openCloseBtnIcon = null;
var headerTitleText=null;

// inputs
var visiblePort = op.inValueBool("Visible", true);
var opacityPort = op.inValueSlider('Opacity', 1);
var defaultMinimizedPort = op.inValueBool('Default Minimized');
var minimizedOpacityPort = op.inValueSlider('Minimized Opacity', 0.5);

var inTitle = op.inString('Title','Sidebar');
var side = op.inValueBool('Side');

// outputs
var childrenPort = op.outObject('childs');

var sidebarEl = document.querySelector('.' + SIDEBAR_ID);
if(!sidebarEl) {
    sidebarEl = initSidebarElement();
}
// if(!sidebarEl) return;
var sidebarItemsEl = sidebarEl.querySelector('.' + SIDEBAR_ITEMS_CLASS);
childrenPort.set({
    parentElement: sidebarItemsEl,
    parentOp: op,
});
onDefaultMinimizedPortChanged();
initSidebarCss();
updateDynamicStyles();

// change listeners
visiblePort.onChange = onVisiblePortChange;
opacityPort.onChange = onOpacityPortChange;
defaultMinimizedPort.onChange = onDefaultMinimizedPortChanged;
minimizedOpacityPort.onChange = onMinimizedOpacityPortChanged;
op.onDelete = onDelete;

// functions

function onMinimizedOpacityPortChanged() {
    updateDynamicStyles();
}

side.onChange=function()
{
    if(side.get()) sidebarEl.classList.add('sidebar-cables-right');
        else sidebarEl.classList.remove('sidebar-cables-right');
};


function onDefaultMinimizedPortChanged() {
    if(!openCloseBtn) { return; }
    if(defaultMinimizedPort.get()) {
        sidebarEl.classList.add('sidebar--closed');
        // openCloseBtn.textContent = BTN_TEXT_CLOSED;
    } else {
        sidebarEl.classList.remove('sidebar--closed');
        // openCloseBtn.textContent = BTN_TEXT_OPEN;
    }
}

function onOpacityPortChange()
{
    var opacity = opacityPort.get();
    sidebarEl.style.opacity = opacity;
}

function onVisiblePortChange() {
    if(visiblePort.get()) {
        sidebarEl.style.display = 'block';
    } else {
        sidebarEl.style.display = 'none';
    }
}

side.onChanged=function()
{

};

/**
 * Some styles cannot be set directly inline, so a dynamic stylesheet is needed.
 * Here hover states can be set later on e.g.
 */
function updateDynamicStyles()
{
    let dynamicStyles = document.querySelectorAll('.' + CSS_ELEMENT_DYNAMIC_CLASS);
    if(dynamicStyles)
    {
        dynamicStyles.forEach(function(e)
        {
            e.parentNode.removeChild(e);
        });
    }
    let newDynamicStyle = document.createElement('style');
    newDynamicStyle.classList.add(CSS_ELEMENT_DYNAMIC_CLASS);
    let cssText = '.sidebar--closed .sidebar__close-button { ';
    cssText +=         'opacity: ' + minimizedOpacityPort.get();
    cssText +=     '}';
    let cssTextEl = document.createTextNode(cssText);
    newDynamicStyle.appendChild(cssTextEl);
    document.body.appendChild(newDynamicStyle);
}

function initSidebarElement()
{
    var element = document.createElement('div');
    element.classList.add(SIDEBAR_CLASS);
    element.classList.add(SIDEBAR_ID);
    var canvasWrapper = op.patch.cgl.canvas.parentElement; /* maybe this is bad outside cables!? */

    // header...
    var headerGroup = document.createElement('div');
    headerGroup.classList.add('sidebar__group');
    element.appendChild(headerGroup);
    var header = document.createElement('div');
    header.classList.add('sidebar__group-header');
    element.appendChild(header);
    var headerTitle = document.createElement('div');
    headerTitle.classList.add('sidebar__group-header-title');
    headerTitleText = document.createElement('span');
    headerTitleText.classList.add('sidebar__group-header-title-text');
    headerTitleText.innerHTML=inTitle.get();
    headerTitle.appendChild(headerTitleText);
    header.appendChild(headerTitle);
    headerGroup.appendChild(header);
    element.appendChild(headerGroup);
    headerGroup.addEventListener('click', onOpenCloseBtnClick);

    if(!canvasWrapper)
    {
        console.warn("[sidebar] no canvas parentelement found...");
        return;
    }
    canvasWrapper.appendChild(element);
    var items = document.createElement('div');
    items.classList.add(SIDEBAR_ITEMS_CLASS);
    element.appendChild(items);
    openCloseBtn = document.createElement('div');
    openCloseBtn.classList.add(SIDEBAR_OPEN_CLOSE_BTN_CLASS);
    openCloseBtn.addEventListener('click', onOpenCloseBtnClick);
    // openCloseBtn.textContent = BTN_TEXT_OPEN;
    element.appendChild(openCloseBtn);
    openCloseBtnIcon = document.createElement('span');
    openCloseBtnIcon.classList.add(SIDEBAR_OPEN_CLOSE_BTN_ICON_CLASS);
    openCloseBtn.appendChild(openCloseBtnIcon);

    return element;
}

inTitle.onChange=function()
{
    if(headerTitleText)headerTitleText.innerHTML=inTitle.get();

};

function setClosed(b)
{

}

function onOpenCloseBtnClick(ev)
{
    ev.stopPropagation();
    if(!sidebarEl) { console.error('Sidebar could not be closed...'); return; }
    sidebarEl.classList.toggle('sidebar--closed');
    const btn = ev.target;
    let btnText = BTN_TEXT_OPEN;
    if(sidebarEl.classList.contains('sidebar--closed')) btnText = BTN_TEXT_CLOSED;
}

function initSidebarCss() {
    //var cssEl = document.getElementById(CSS_ELEMENT_ID);
    var cssElements = document.querySelectorAll('.' + CSS_ELEMENT_CLASS);
    // remove old script tag
    if(cssElements) {
        cssElements.forEach(function(e) {
            e.parentNode.removeChild(e);
        });
    }
    var newStyle = document.createElement('style');
    newStyle.innerHTML = attachments.style_css;
    newStyle.classList.add(CSS_ELEMENT_CLASS);
    document.body.appendChild(newStyle);
}

function onDelete() {
    removeElementFromDOM(sidebarEl);
}

function removeElementFromDOM(el) {
    if(el && el.parentNode && el.parentNode.removeChild) el.parentNode.removeChild(el);
}



};

Ops.Sidebar.Sidebar.prototype = new CABLES.Op();
CABLES.OPS["5a681c35-78ce-4cb3-9858-bc79c34c6819"]={f:Ops.Sidebar.Sidebar,objName:"Ops.Sidebar.Sidebar"};




// **************************************************************
// 
// Ops.WebAudio.FFTAreaAverage
// 
// **************************************************************

Ops.WebAudio.FFTAreaAverage = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    fftArr=op.inArray("FFT Array"),
    refresh=op.inTriggerButton("refresh"),
    x=op.inValueSlider("x"),
    y=op.inValueSlider("y"),
    w=op.inValueSlider("width",0.2),
    h=op.inValueSlider("height",0.2),
    drawTex=op.inValueBool("Create Texture",true),
    texOut=op.outTexture("texture_out"),
    value=op.outValue("value");

const cgl=op.patch.cgl;
var data=[];
var line=0;
var size=128;

const canvas = document.createElement('canvas');
canvas.id = "fft_"+CABLES.uuid();
canvas.width = canvas.height = size;
canvas.style.display = "none";
var body = document.getElementsByTagName("body")[0];
body.appendChild(canvas);
const ctx = canvas.getContext('2d');

var areaX=0;
var areaY=0;
var areaW=20;
var areaH=20;
var amount=0;

refresh.onTriggered=function()
{
    var arr=fftArr.get();
    if(!arr)return;
    var width=arr.length;

    const draw=drawTex.get();

    if(draw)
    {
        ctx.beginPath();
        ctx.fillStyle="#000";
        ctx.strokeStyle="#ff0";
        ctx.fillRect(0,0,canvas.width,canvas.height);

        ctx.fillStyle="#888";
        for(var i=0;i<arr.length;i++)
            ctx.fillRect(i,size-arr[i],1,arr[i]);

    }

    areaX=x.get()*canvas.width;
    areaY=y.get()*canvas.height;

    areaW=w.get()*size/2;
    areaH=h.get()*size/2;


    if(draw)ctx.rect(areaX,areaY,areaW,areaH);
    if(draw)ctx.stroke();

    var val=0;
    var count=0;
    for(var xc=areaX;xc<areaX+areaW;xc++)
        for(var yc=areaY;yc<areaY+areaH;yc++)
            if(arr[Math.round(xc)]>size-yc)count++;

    if(amount!=amount)amount=0;
    amount=amount+count/(areaW*areaH);
    amount/=2;
    value.set(amount);

    if(draw)
    {
        ctx.fillStyle="#ff0";
        ctx.fillRect(0,0,amount*canvas.width,5);

        if(texOut.get()) texOut.get().initTexture(canvas,CGL.Texture.FILTER_NEAREST);
            else texOut.set(new CGL.Texture.createFromImage( cgl, canvas, { "filter":CGL.Texture.FILTER_NEAREST } ));
    }

};


};

Ops.WebAudio.FFTAreaAverage.prototype = new CABLES.Op();
CABLES.OPS["ed633fe4-3200-4890-8d9e-ccd1ea478c74"]={f:Ops.WebAudio.FFTAreaAverage,objName:"Ops.WebAudio.FFTAreaAverage"};




// **************************************************************
// 
// Ops.WebAudio.AudioAnalyzer
// 
// **************************************************************

Ops.WebAudio.AudioAnalyzer = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var audioCtx=CABLES.WEBAUDIO.createAudioContext(op);
const inFftSize = op.inSwitch("FFT size",[64,128,256,512,1024],256);
const analyser = audioCtx.createAnalyser();
analyser.smoothingTimeConstant = 0.3;
analyser.fftSize = 256;

const refresh=op.addInPort(new CABLES.Port(op,"refresh",CABLES.OP_PORT_TYPE_FUNCTION));
const audioIn = CABLES.WEBAUDIO.createAudioInPort(op, "Audio In", analyser);
const anData=op.inValueSelect("Data",["Frequency","Time Domain"],"Frequency");

const next=op.outTrigger("Next");
const audioOutPort = CABLES.WEBAUDIO.createAudioOutPort(op, "Audio Out", analyser);
const avgVolume=op.addOutPort(new CABLES.Port(op, "average volume",CABLES.OP_PORT_TYPE_VALUE));
const fftOut=op.addOutPort(new CABLES.Port(op, "fft",CABLES.OP_PORT_TYPE_ARRAY));

var fftBufferLength = analyser.frequencyBinCount;
var fftDataArray = new Uint8Array(fftBufferLength);
var getFreq=true;
var array=null;

inFftSize.onChange = function()
{
    analyser.fftSize = inFftSize.get();
}

anData.onChange=function() {
    if(anData.get()=="Frequency")getFreq=true;
    if(anData.get()=="Time Domain")getFreq=false;
};

refresh.onTriggered = function()
{
    analyser.minDecibels = -90;
    analyser.maxDecibels = 0;

    if(fftBufferLength != analyser.frequencyBinCount)
    {
        console.log("change!");
        fftBufferLength = analyser.frequencyBinCount;
        fftDataArray = new Uint8Array(fftBufferLength);
    }

    if(!fftDataArray)
    {
        //op.log("[audioanalyzer] fftDataArray is null, returning.");
        return;
    }

    var values = 0;

    for (var i = 0; i < fftDataArray.length; i++) values += fftDataArray[i];

    var average = values / fftDataArray.length;

    avgVolume.set(average/128);
    try
    {
        if(getFreq) analyser.getByteFrequencyData(fftDataArray);
            else analyser.getByteTimeDomainData(fftDataArray);
    }
    catch(e) { op.log(e); }

    fftOut.set(null);
    fftOut.set(fftDataArray);

    next.trigger();
};



};

Ops.WebAudio.AudioAnalyzer.prototype = new CABLES.Op();
CABLES.OPS["22523fae-a623-401d-b952-a57c26de4b4e"]={f:Ops.WebAudio.AudioAnalyzer,objName:"Ops.WebAudio.AudioAnalyzer"};




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
// Ops.Anim.Smooth
// 
// **************************************************************

Ops.Anim.Smooth = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const exec=op.inTrigger("Update");
const inMode = op.inBool("Separate inc/dec",false);
const inVal=op.inValue("Value");
const next=op.outTrigger("Next");
const inDivisorUp=op.inValue("Inc factor",4);
const inDivisorDown=op.inValue("Dec factor",4);
const result=op.outValue("Result",0);

var val=0;
var goal=0;
var oldVal=0;
var lastTrigger=0;
op.toWorkPortsNeedToBeLinked(exec);

var divisorUp;
var divisorDown;
var divisor = 4;

var selectIndex = 0;
const MODE_SINGLE = 0;
const MODE_UP_DOWN = 1;

onFilterChange();
getDivisors();

inMode.setUiAttribs({hidePort:true});

inDivisorUp.onChange = inDivisorDown.onChange = getDivisors;
inMode.onChange = onFilterChange;
update();

function onFilterChange()
{
    var selectedMode = inMode.get();
    if(selectedMode === false) selectIndex = MODE_SINGLE;
    else if(selectedMode === true) selectIndex = MODE_UP_DOWN;


    if(selectIndex == MODE_SINGLE)
    {
        inDivisorDown.setUiAttribs({greyout:true});
        inDivisorUp.setUiAttribs({title:"Inc/Dec factor"});

    }
    else if (selectIndex == MODE_UP_DOWN)
    {
        inDivisorDown.setUiAttribs({greyout:false});
        inDivisorUp.setUiAttribs({title:"Inc factor"});
    }

    getDivisors();
    update();
};

function getDivisors()
{
    if(selectIndex == MODE_SINGLE)
    {
        divisorUp=inDivisorUp.get();
        divisorDown=inDivisorUp.get();
    }
    else if (selectIndex == MODE_UP_DOWN)
    {
        divisorUp=inDivisorUp.get();
        divisorDown=inDivisorDown.get();
    }

    if(divisorUp<=0.2 || divisorUp != divisorUp )divisorUp=0.2;
    if(divisorDown<=0.2 || divisorDown != divisorDown )divisorDown=0.2;
};

inVal.onChange=function()
{
    goal=inVal.get();
};

inDivisorUp.onChange=function()
{
    getDivisors();
};

function update()
{
    var tm=1;
    if(CABLES.now()-lastTrigger>500 || lastTrigger===0)val=inVal.get();
    else tm=(CABLES.now()-lastTrigger)/16;
    lastTrigger=CABLES.now();

    if(divisor<=0)divisor=0.0001;

    var diff = goal-val;

    if(diff  >= 0)
        val=val+(diff)/(divisorDown*tm);
    else
        val=val+(diff)/(divisorUp*tm);
    //val=val+(goal-val)/(divisor*tm);

    if(val>0 && val<0.000000001)val=0;
    if(divisor!=divisor)val=0;
    if(val!=val|| val== -Infinity || val==Infinity)val=inVal.get();

    if(oldVal!=val)
    {
        result.set(val);
        oldVal=val;
    }

    next.trigger();
};

exec.onTriggered = function()
{
    update();
};






};

Ops.Anim.Smooth.prototype = new CABLES.Op();
CABLES.OPS["5677b5b5-753a-4fbf-9e91-64c81ec68a2f"]={f:Ops.Anim.Smooth,objName:"Ops.Anim.Smooth"};




// **************************************************************
// 
// Ops.Devices.Keyboard.CursorKeys
// 
// **************************************************************

Ops.Devices.Keyboard.CursorKeys = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    canvasOnly=op.inValueBool("canvas only",true),
    keysCursor=op.inValueBool("Cursor Keys",true),
    keysWasd=op.inValueBool("WASD",true),
    pressedUp=op.outValue("Up"),
    pressedDown=op.outValue("Down"),
    pressedLeft=op.outValue("Left"),
    pressedRight=op.outValue("Right");

const cgl=op.patch.cgl;

function onKeyDown(e)
{
    if(keysWasd.get())
    {
        if(e.keyCode==87) pressedUp.set(true);
        if(e.keyCode==83) pressedDown.set(true);
        if(e.keyCode==65) pressedLeft.set(true);
        if(e.keyCode==68) pressedRight.set(true);
    }
    if(keysCursor.get())
    {
        if(e.keyCode==38) pressedUp.set(true);
        if(e.keyCode==40) pressedDown.set(true);
        if(e.keyCode==37) pressedLeft.set(true);
        if(e.keyCode==39) pressedRight.set(true);
    }
}

function onKeyUp(e)
{
    if(keysWasd.get())
    {
        if(e.keyCode==87) pressedUp.set(false);
        if(e.keyCode==83) pressedDown.set(false);
        if(e.keyCode==65) pressedLeft.set(false);
        if(e.keyCode==68) pressedRight.set(false);
    }
    if(keysCursor.get())
    {
        if(e.keyCode==38) pressedUp.set(false);
        if(e.keyCode==40) pressedDown.set(false);
        if(e.keyCode==37) pressedLeft.set(false);
        if(e.keyCode==39) pressedRight.set(false);
    }
}

op.onDelete=function()
{
    cgl.canvas.removeEventListener('keyup', onKeyUp, false);
    cgl.canvas.removeEventListener('keydown', onKeyDown, false);
    document.removeEventListener("keyup", onKeyUp, false);
    document.removeEventListener("keydown", onKeyDown, false);
};


function addListener()
{
    if(canvasOnly.get() === true) addCanvasListener();
        else addDocumentListener();
}

function removeListeners() {
    document.removeEventListener("keydown", onKeyDown, false);
    document.removeEventListener("keyup", onKeyUp, false);
    cgl.canvas.removeEventListener('keydown', onKeyDown, false);
    cgl.canvas.removeEventListener('keyup', onKeyUp, false);
}

function addCanvasListener() {
    cgl.canvas.addEventListener("keydown", onKeyDown, false );
    cgl.canvas.addEventListener("keyup", onKeyUp, false );
}

function addDocumentListener() {
    document.addEventListener("keydown", onKeyDown, false);
    document.addEventListener("keyup", onKeyUp, false);
}

canvasOnly.onChange=function()
{
    removeListeners();
    addListener();
};

canvasOnly.set(true);
addCanvasListener();


};

Ops.Devices.Keyboard.CursorKeys.prototype = new CABLES.Op();
CABLES.OPS["65930ca9-c923-453f-b8c4-144eda13fa0a"]={f:Ops.Devices.Keyboard.CursorKeys,objName:"Ops.Devices.Keyboard.CursorKeys"};




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
// Ops.Sidebar.Toggle
// 
// **************************************************************

Ops.Sidebar.Toggle = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const DEFAULT_VALUE_DEFAULT = true;

// inputs
let parentPort = op.inObject("link");
let labelPort = op.inValueString("Text", "Toggle");
const inputValuePort = op.inValueBool("Input", DEFAULT_VALUE_DEFAULT);
const setDefaultValueButtonPort = op.inTriggerButton("Set Default");
let defaultValuePort = op.inValueBool("Default", DEFAULT_VALUE_DEFAULT);
defaultValuePort.setUiAttribs({ "hidePort": true, "greyout": true });
const inGreyOut = op.inBool("Grey Out", false);
const inVisible = op.inBool("Visible", true);

// outputs
let siblingsPort = op.outObject("childs");
let valuePort = op.outValue("Value", defaultValuePort.get());

// vars
let el = document.createElement("div");
el.classList.add("sidebar__item");
el.classList.add("sidebar__toggle");
if (DEFAULT_VALUE_DEFAULT) el.classList.add("sidebar__toggle--active");

el.addEventListener("click", onInputClick);
let label = document.createElement("div");
label.classList.add("sidebar__item-label");
let labelText = document.createTextNode(labelPort.get());
label.appendChild(labelText);
el.appendChild(label);
// var value = document.createElement('div');
// value.textContent = DEFAULT_VALUE_DEFAULT;
// value.classList.add('sidebar__item-value-label');
// el.appendChild(value);
// var input = document.createElement('div');
// input.classList.add('sidebar__toggle-input');
// el.appendChild(input);


let icon = document.createElement("div");
icon.classList.add("icon_toggle");
el.appendChild(icon);


let greyOut = document.createElement("div");
greyOut.classList.add("sidebar__greyout");
el.appendChild(greyOut);
greyOut.style.display = "none";

// events
parentPort.onChange = onParentChanged;
labelPort.onChange = onLabelTextChanged;
defaultValuePort.onChange = onDefaultValueChanged;
inputValuePort.onChange = onInputValuePortChanged;
op.onDelete = onDelete;
setDefaultValueButtonPort.onTriggered = setDefaultValue;
// op.toWorkNeedsParent('Ops.Sidebar.Sidebar');

function setDefaultValue()
{
    const defaultValue = inputValuePort.get();
    defaultValuePort.set(defaultValue);
    valuePort.set(defaultValue);
    if (CABLES.UI && op.isCurrentUiOp()) gui.patch().showOpParams(op); /* update DOM */
}

function onInputClick()
{
    el.classList.toggle("sidebar__toggle--active");
    if (el.classList.contains("sidebar__toggle--active"))
    {
        valuePort.set(true);
        inputValuePort.set(true);
        // value.textContent = 'true';
        icon.classList.add("icon_toggle_true");
        icon.classList.remove("icon_toggle_false");
    }
 else
{
        icon.classList.remove("icon_toggle_true");
        icon.classList.add("icon_toggle_false");

        valuePort.set(false);
        inputValuePort.set(false);
        // value.textContent = 'false';
    }
    if (CABLES.UI && op.isCurrentUiOp()) gui.patch().showOpParams(op); /* update DOM */
}

function onInputValuePortChanged()
{
    let inputValue = inputValuePort.get();
    if (inputValue)
    {
        el.classList.add("sidebar__toggle--active");
        valuePort.set(true);
        // value.textContent = 'true';
    }
 else
{
        el.classList.remove("sidebar__toggle--active");
        valuePort.set(false);
        // value.textContent = 'false';
    }
}

function onDefaultValueChanged()
{
    /*
    var defaultValue = defaultValuePort.get();
    if(defaultValue) {
        el.classList.add('sidebar__toggle--active');
        valuePort.set(true);
    } else {
        el.classList.remove('sidebar__toggle--active');
        valuePort.set(false);
    }
    */
}

function onLabelTextChanged()
{
    let labelText = labelPort.get();
    label.textContent = labelText;
    if (CABLES.UI) op.setTitle("Toggle: " + labelText);
}

function onParentChanged()
{
    let parent = parentPort.get();
    if (parent && parent.parentElement)
    {
        parent.parentElement.appendChild(el);
        siblingsPort.set(null);
        siblingsPort.set(parent);
    }
    else if (el.parentElement) el.parentElement.removeChild(el);
}

function showElement(el)
{
    if (el) el.style.display = "block";
}

function hideElement(el)
{
    if (el) el.style.display = "none";
}

function onDelete()
{
    removeElementFromDOM(el);
}

function removeElementFromDOM(el)
{
    if (el && el.parentNode && el.parentNode.removeChild) el.parentNode.removeChild(el);
}

inGreyOut.onChange = function ()
{
    greyOut.style.display = inGreyOut.get() ? "block" : "none";
};

inVisible.onChange = function ()
{
    el.style.display = inVisible.get() ? "block" : "none";
};


};

Ops.Sidebar.Toggle.prototype = new CABLES.Op();
CABLES.OPS["334bcf18-e2d0-46ad-bf7a-0d36c3d29af9"]={f:Ops.Sidebar.Toggle,objName:"Ops.Sidebar.Toggle"};




// **************************************************************
// 
// Ops.User.timothe.Autofilter
// 
// **************************************************************

Ops.User.timothe.Autofilter = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
CABLES.WEBAUDIO.createAudioContext(op);

// TODO: Add filter / filter-op needed?

// vars
var node = new Tone.AutoFilter("4n").start(); // TODO: create start / stop nodes!?

// default values
var DEPTH_DEFAULT = 1;
var DEPTH_MIN = 0;
var DEPTH_MAX = 1;
var FREQUENCY_DEFAULT = 200;
var OSCILLATOR_TYPES = ["sine", "square", "triangle", "sawtooth"];
/*
var MIN_DEFAULT = 100; // ??
var MIN_MIN = 0; // ??
var MIN_MAX = 20000; // ??
*/
var OCTAVES_DEFAULT = 5;
var OCTAVES_MIN = -1;
var OCTAVES_MAX = 10;
var WET_DEFAULT = 1.0;
var WET_MIN = 0.0;
var WET_MAX = 1.0;

// input ports
var audioInPort = CABLES.WEBAUDIO.createAudioInPort(op, "Audio In", node);
var depthPort = CABLES.WEBAUDIO.createAudioParamInPort(op, "Depth", node.depth, {"display": "range", "min": DEPTH_MIN, "max": DEPTH_MAX}, DEPTH_DEFAULT);
var frequencyPort = CABLES.WEBAUDIO.createAudioParamInPort(op, "Frequency", node.frequency, null, FREQUENCY_DEFAULT);
//var filterPort = op.inObject("Filter");
var typePort = this.addInPort( new CABLES.Port( op, "Type", CABLES.OP_PORT_TYPE_VALUE, { display: 'dropdown', values: OSCILLATOR_TYPES }, OSCILLATOR_TYPES[0] ) );
typePort.set(OSCILLATOR_TYPES[0]);
//var minPort = op.inValue("Min", MIN_DEFAULT); // not noticable, tone.js bug?
var octavesPort = op.inValue("Octaves", OCTAVES_DEFAULT);
var wetPort = CABLES.WEBAUDIO.createAudioParamInPort(op, "Wet", node.wet, {"display": "range", "min": WET_MIN, "max": WET_MAX}, WET_DEFAULT);

// change listeners
/*
minPort.onChange = function() {
    var min = minPort.get();
    if(min && min >= MIN_MIN && min >= MIN_MAX) {
        node.set("min", minPort.get());
    }
};*/


octavesPort.onChange = function() {
    var octaves = octavesPort.get();
    if(octaves) {
        octaves = Math.round(parseFloat(octaves));
        if(octaves && octaves >= OCTAVES_MIN && octaves <= OCTAVES_MAX) {
            node.set("octaves", octaves);
        }
    }
};

typePort.onChange = function() {
    if(typePort.get()) {
        node.set("type", typePort.get());
    }
};

// output ports
var audioOutPort = CABLES.WEBAUDIO.createAudioOutPort(op, "Audio Out", node);



};

Ops.User.timothe.Autofilter.prototype = new CABLES.Op();





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


window.addEventListener('load', function(event) {
CABLES.jsLoaded=new Event('CABLES.jsLoaded');
document.dispatchEvent(CABLES.jsLoaded);
});
