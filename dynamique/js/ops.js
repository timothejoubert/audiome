"use strict";

var CABLES=CABLES||{};
CABLES.OPS=CABLES.OPS||{};

var Ops=Ops || {};
Ops.Ui=Ops.Ui || {};
Ops.Gl=Ops.Gl || {};
Ops.Anim=Ops.Anim || {};
Ops.Math=Ops.Math || {};
Ops.User=Ops.User || {};
Ops.Html=Ops.Html || {};
Ops.Value=Ops.Value || {};
Ops.Sidebar=Ops.Sidebar || {};
Ops.Devices=Ops.Devices || {};
Ops.Boolean=Ops.Boolean || {};
Ops.WebAudio=Ops.WebAudio || {};
Ops.Gl.Meshes=Ops.Gl.Meshes || {};
Ops.Gl.Shader=Ops.Gl.Shader || {};
Ops.Math.Compare=Ops.Math.Compare || {};
Ops.User.timothe=Ops.User.timothe || {};
Ops.Devices.Mouse=Ops.Devices.Mouse || {};
Ops.Devices.Keyboard=Ops.Devices.Keyboard || {};
Ops.Gl.TextureEffects=Ops.Gl.TextureEffects || {};
Ops.Gl.TextureEffects.Noise=Ops.Gl.TextureEffects.Noise || {};



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
// Ops.Gl.TextureEffects.Levels
// 
// **************************************************************

Ops.Gl.TextureEffects.Levels = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={levels_frag:"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI float inMin;\nUNI float inMax;\nUNI float midPoint;\nUNI float outMax;\nUNI float outMin;\n\nvoid main()\n{\n    vec3 base=texture(tex,texCoord).rgb;\n    vec3 inputRange = min(max(base - vec3(inMin), vec3(0.0)) / (vec3(inMax) - vec3(inMin)), vec3(outMax));\n\n    inputRange = pow(inputRange, vec3(1.0 / (1.5 - midPoint)));\n\n    outColor.a=1.0;\n    outColor.rgb= mix(vec3(outMin), vec3(1.0), inputRange);\n}",};
var render=op.inTrigger('Render');

var inMin=op.inValueSlider("In Min",0);
var inMid=op.inValueSlider("Midpoint",0.5);
var inMax=op.inValueSlider("In Max",1);

var outMin=op.inValueSlider("Out Min",0);
var outMax=op.inValueSlider("Out Max",1);

var trigger=op.addOutPort(new CABLES.Port(op,"Next",CABLES.OP_PORT_TYPE_FUNCTION));

var cgl=op.patch.cgl;
var shader=new CGL.Shader(cgl);

var uniInMin=new CGL.Uniform(shader,'f','inMin',inMin);
var uniInMid=new CGL.Uniform(shader,'f','midPoint',inMid);
var uniInMax=new CGL.Uniform(shader,'f','inMax',inMax);

var uniOutMin=new CGL.Uniform(shader,'f','outMin',outMin);
var uniOutMax=new CGL.Uniform(shader,'f','outMax',outMax);

shader.setSource(shader.getDefaultVertexShader(),attachments.levels_frag);
var textureUniform=new CGL.Uniform(shader,'t','tex',0);

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

Ops.Gl.TextureEffects.Levels.prototype = new CABLES.Op();
CABLES.OPS["42ad6bbe-df17-48c7-89dd-bd7022113897"]={f:Ops.Gl.TextureEffects.Levels,objName:"Ops.Gl.TextureEffects.Levels"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.Noise.Noise
// 
// **************************************************************

Ops.Gl.TextureEffects.Noise.Noise = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={noise_frag:"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI float amount;\nUNI float time;\n\n{{CGL.BLENDMODES}}\n{{MODULES_HEAD}}\n\n{{CGL.RANDOM_TEX}}\n\nvoid main()\n{\n    vec4 rnd;\n\n    #ifndef RGB\n        float r=cgl_random(texCoord.xy+vec2(time));\n        rnd=vec4( r,r,r,1.0 );\n    #endif\n\n    #ifdef RGB\n        rnd=vec4(cgl_random3(texCoord.xy+vec2(time)),1.0);\n    #endif\n\n    vec4 base=texture(tex,texCoord);\n    vec4 col=vec4( _blend(base.rgb,rnd.rgb) ,1.0);\n\n    outColor=vec4( mix( col.rgb, base.rgb ,1.0-base.a*amount),1.0);\n}",};
const
    render=op.inTrigger('Render'),
    blendMode=CGL.TextureEffect.AddBlendSelect(op,"Blend Mode","normal"),
    amount=op.inValueSlider("Amount",1),
    animated=op.inValueBool("Animated",true),
    inRGB=op.inValueBool("RGB",false),
    trigger=op.outTrigger("Next");

const
    cgl=op.patch.cgl,
    shader=new CGL.Shader(cgl),
    amountUniform=new CGL.Uniform(shader,'f','amount',amount),
    timeUniform=new CGL.Uniform(shader,'f','time',1.0),
    textureUniform=new CGL.Uniform(shader,'t','tex',0);

shader.setSource(shader.getDefaultVertexShader(),attachments.noise_frag);

CGL.TextureEffect.setupBlending(op,shader,blendMode,amount);

op.toWorkPortsNeedToBeLinked(render);

inRGB.onChange=function()
{
    if(inRGB.get())shader.define("RGB");
    else shader.removeDefine("RGB");
};

shader.bindTextures=function()
{
    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex );
};

render.onTriggered=function()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;

    if(animated.get()) timeUniform.setValue(op.patch.freeTimer.get()/1000%100);
        else timeUniform.setValue(0);

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};



};

Ops.Gl.TextureEffects.Noise.Noise.prototype = new CABLES.Op();
CABLES.OPS["81253441-cc73-42fa-b903-6d23806873d9"]={f:Ops.Gl.TextureEffects.Noise.Noise,objName:"Ops.Gl.TextureEffects.Noise.Noise"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.Sharpen
// 
// **************************************************************

Ops.Gl.TextureEffects.Sharpen = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={sharpen_frag:"\nIN vec2 texCoord;\nUNI sampler2D tex;\nUNI float amount;\n\nUNI float pX,pY;\n\nconst vec4 lumcoeff = vec4(0.299,0.587,0.114, 0.);\n\nfloat desaturate(vec4 color)\n{\n  vec3 c= vec3(dot(vec3(0.2126,0.7152,0.0722), color.rgb));\n  return (c.r+c.g+c.b)/3.0;\n}\n\n\n\nvoid main()\n{\n    \n    vec4 col=vec4(1.0,0.0,0.0,1.0);\n    col=texture(tex,texCoord);\n    \n    \n    float colorL = desaturate(texture(tex, texCoord+vec2(-pX,0) ));\n    float colorR = desaturate(texture(tex, texCoord+vec2( pX,0) ));\n    float colorA = desaturate(texture(tex, texCoord+vec2( 0,-pY) ));\n    float colorB = desaturate(texture(tex, texCoord+vec2( 0, pY) ));\n    \n    float colorLA = desaturate(texture(tex, texCoord+vec2(-pX,pY)));\n    float colorRA = desaturate(texture(tex, texCoord+vec2( pX,pY)));\n    float colorLB = desaturate(texture(tex, texCoord+vec2(-pX,-pY)));\n    float colorRB = desaturate(texture(tex, texCoord+vec2( pX,-pY)));\n    \n    vec4 final = col + col * amount * (8.0*desaturate(col) - colorL - colorR - colorA - colorB - colorLA - colorRA - colorLB - colorRB);\n\n    outColor= final;\n\n}",};
const render=op.inTrigger("Render");
const trigger=op.outTrigger("Trigger");
const amount=op.inValueSlider("amount",0.5);

const cgl=op.patch.cgl;
const shader=new CGL.Shader(cgl);

shader.setSource(shader.getDefaultVertexShader(),attachments.sharpen_frag);
const textureUniform=new CGL.Uniform(shader,'t','tex',0);
const amountUniform=new CGL.Uniform(shader,'f','amount',amount);

const uniPx=new CGL.Uniform(shader,'f','pX',1/1024);
const uniPy=new CGL.Uniform(shader,'f','pY',1/1024);

render.onTriggered=function()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;

    uniPx.setValue(1/cgl.currentTextureEffect.getCurrentSourceTexture().width);
    uniPy.setValue(1/cgl.currentTextureEffect.getCurrentSourceTexture().height);

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.TextureEffects.Sharpen.prototype = new CABLES.Op();
CABLES.OPS["55647083-131d-4c70-b667-21fecf311ea5"]={f:Ops.Gl.TextureEffects.Sharpen,objName:"Ops.Gl.TextureEffects.Sharpen"};




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
// Ops.Anim.BoolAnim
// 
// **************************************************************

Ops.Anim.BoolAnim = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var anim=new CABLES.Anim();

const
    exe=op.inTrigger("exe"),
    bool=op.inValueBool("bool"),
    pease=anim.createPort(op,"easing"),
    duration=op.inValue("duration",0.5),
    dir=op.inValueSelect("Direction",["Animate Both","Only True","Only False"],"Both"),
    valueFalse=op.inValue("value false",0),
    valueTrue=op.inValue("value true",1),
    next=op.outTrigger("trigger"),
    value=op.outValue("value"),
    finished=op.outValueBool("finished"),
    finishedTrigger=op.outTrigger("Finished Trigger");


var startTime=CABLES.now();
op.toWorkPortsNeedToBeLinked(exe);
op.setPortGroup("Animation",[duration,pease]);
op.setPortGroup("Values",[valueFalse,valueTrue]);

dir.onChange=bool.onChange=valueFalse.onChange=valueTrue.onChange=duration.onChange=setAnim;
setAnim();

function setAnim()
{
    finished.set(false);
    var now=(CABLES.now()-startTime)/1000;
    var oldValue=anim.getValue(now);
    anim.clear();

    anim.setValue(now,oldValue);


    if(!bool.get())
    {
        if(dir.get()!='Only True' ) anim.setValue(now+duration.get(),valueFalse.get());
            else anim.setValue(now,valueFalse.get());
    }
    else
    {
        if(dir.get()!='Only False' ) anim.setValue(now+duration.get(),valueTrue.get());
            else anim.setValue(now,valueTrue.get());

    }
}


exe.onTriggered=function()
{
    var t=(CABLES.now()-startTime)/1000;
    value.set(anim.getValue(t));

    if(anim.hasEnded(t))
    {
        if(!finished.get()) finishedTrigger.trigger();
        finished.set(true);
    }

    next.trigger();
};



};

Ops.Anim.BoolAnim.prototype = new CABLES.Op();
CABLES.OPS["06ad9d35-ccf5-4d31-889c-e23fa062588a"]={f:Ops.Anim.BoolAnim,objName:"Ops.Anim.BoolAnim"};




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
// Ops.Gl.TextureEffects.CircleTexture_v2
// 
// **************************************************************

Ops.Gl.TextureEffects.CircleTexture_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={circle_frag:"IN vec2 texCoord;\nUNI sampler2D tex;\n\nUNI float amount;\nUNI float size;\nUNI float inner;\nUNI float fadeOut;\n\nUNI float r;\nUNI float g;\nUNI float b;\nUNI float a;\nUNI float aspect;\nUNI float stretch;\n\nUNI float x;\nUNI float y;\n\n{{CGL.BLENDMODES}}\n\nfloat dist(float x,float y,float x2,float y2)\n{\n\tfloat xd = x2-x;\n\tfloat yd = y2-y;\n\treturn abs(sqrt(xd*xd + yd*yd*(1.0-stretch)));\n}\n\nvoid main()\n{\n    vec4 base=texture(tex,texCoord);\n    vec4 col=vec4(0.0,0.0,0.0,1.0);\n    float dist = dist(x,y,texCoord.x-0.5,(1.0-texCoord.y-1.0)*aspect+0.5);\n\n    float sz=size*0.5;\n    float v=0.0;\n    float fade=fadeOut+0.002;\n\n    if(dist<sz && dist>inner*sz) v=1.0;\n\n    #ifdef FALLOFF_SMOOTHSTEP\n        if(dist>sz && dist<sz+fade)v=1.0-(smoothstep(0.0,1.0,(dist-sz)/(fade)) );\n    #endif\n    #ifndef FALLOFF_SMOOTHSTEP\n        if(dist>sz && dist<sz+fade)v=1.0-((dist-sz)/(fade));\n    #endif\n\n    col=vec4( _blend(base.rgb,vec3(r,g,b)) ,1.0);\n    col=vec4( mix( col.rgb, base.rgb ,1.0-base.a*v*amount),1.0);\n    outColor=col;\n\n    #ifdef WARN_OVERFLOW\n        float width=0.01;\n        if( texCoord.x>(1.0-width) || texCoord.y>(1.0-width) || texCoord.y<width || texCoord.x<width )\n            if(v>0.001*amount)outColor= vec4(1.0,0.0,0.0, 1.0);\n    #endif\n}\n",};
var render=op.inTrigger("render");
var blendMode=CGL.TextureEffect.AddBlendSelect(op,"Blend Mode","normal");
var amount=op.inValueSlider("Amount",1);
var inSize=op.inValueSlider("size");
var inInner=op.inValueSlider("Inner");
var inStretch=op.inValueSlider("Stretch");

var inX=op.inValue("Pos X",0);
var inY=op.inValue("Pos Y",0);

var fallOff=op.inValueSelect("fallOff",['Linear','SmoothStep'],"Linear");
var inFadeOut=op.inValueSlider("fade Out");
var warnOverflow=op.inValueBool("warn overflow",true);

const r = op.inValueSlider("r", 1);
const g = op.inValueSlider("g", 1);
const b = op.inValueSlider("b", 1);
const a = op.inValueSlider("a", 1);

r.setUiAttribs({ colorPick: true });

op.setPortGroup("Size",[inSize,inInner,inStretch]);
op.setPortGroup("Position",[inX,inY]);
op.setPortGroup("Style",[warnOverflow,fallOff,inFadeOut]);


var trigger=op.outTrigger('trigger');

var cgl=op.patch.cgl;
var shader=new CGL.Shader(cgl,'textureeffect stripes');
shader.setSource(shader.getDefaultVertexShader(),attachments.circle_frag);
var textureUniform=new CGL.Uniform(shader,'t','tex',0);
var amountUniform=new CGL.Uniform(shader,'f','amount',amount);


var uniStretch=new CGL.Uniform(shader,'f','stretch',inStretch);
var uniSize=new CGL.Uniform(shader,'f','size',inSize);
var uniFadeOut=new CGL.Uniform(shader,'f','fadeOut',inFadeOut);
var uniInner=new CGL.Uniform(shader,'f','inner',inInner);
var aspect=new CGL.Uniform(shader,'f','aspect',1);

inSize.set(0.25);

setFallOf();
setWarnOverflow();

var uniformR=new CGL.Uniform(shader,'f','r',r);
var uniformG=new CGL.Uniform(shader,'f','g',g);
var uniformB=new CGL.Uniform(shader,'f','b',b);
var uniformA=new CGL.Uniform(shader,'f','a',a);

var uniformX=new CGL.Uniform(shader,'f','x',inX);
var uniformY=new CGL.Uniform(shader,'f','y',inY);

fallOff.onChange=setFallOf;
warnOverflow.onChange=setWarnOverflow;

CGL.TextureEffect.setupBlending(op,shader,blendMode,amount);

function setFallOf()
{
    shader.removeDefine('FALLOFF_LINEAR');
    shader.removeDefine('FALLOFF_SMOOTHSTEP');

    if(fallOff.get()=='Linear') shader.define('FALLOFF_LINEAR');
    if(fallOff.get()=='SmoothStep') shader.define('FALLOFF_SMOOTHSTEP');
}

function setWarnOverflow()
{
    if(warnOverflow.get()) shader.define('WARN_OVERFLOW');
        else shader.removeDefine('WARN_OVERFLOW');
}

render.onTriggered=function()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;

    var a=cgl.currentTextureEffect.getCurrentSourceTexture().height/cgl.currentTextureEffect.getCurrentSourceTexture().width;
    aspect.set(a);

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};



};

Ops.Gl.TextureEffects.CircleTexture_v2.prototype = new CABLES.Op();
CABLES.OPS["03a2ff88-f3af-4042-8e64-62e70e17e1bc"]={f:Ops.Gl.TextureEffects.CircleTexture_v2,objName:"Ops.Gl.TextureEffects.CircleTexture_v2"};




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
// Ops.Gl.TextureEffects.PixelDisplacement_v3
// 
// **************************************************************

Ops.Gl.TextureEffects.PixelDisplacement_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={pixeldisplace3_frag:"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI sampler2D displaceTex;\nUNI float amountX;\nUNI float amountY;\nUNI float amount;\n\n{{CGL.BLENDMODES}}\n\nvec3 getOffset(vec3 offset)\n{\n    #ifdef ZERO_BLACK\n        return offset;\n    #endif\n\n    #ifdef ZERO_GREY\n        return offset*2.0-1.0;\n    #endif\n}\n\nfloat getOffset(float offset)\n{\n    #ifdef ZERO_BLACK\n        return offset;\n    #endif\n\n    #ifdef ZERO_GREY\n        return offset*2.0-1.0;\n    #endif\n}\n\nvoid main()\n{\n    vec3 offset=texture(displaceTex,texCoord).rgb;\n    float x,y;\n\n    #ifdef INPUT_REDGREEN\n        offset=getOffset(offset);\n        x=offset.r*amountX+texCoord.x;\n        y=offset.g*amountY+texCoord.y;\n    #endif\n    #ifdef INPUT_RED\n        offset=getOffset(offset);\n        x=offset.r*amountX+texCoord.x;\n        y=offset.r*amountY+texCoord.y;\n    #endif\n    #ifdef INPUT_GREEN\n        offset=getOffset(offset);\n        x=offset.g*amountX+texCoord.x;\n        y=offset.g*amountY+texCoord.y;\n    #endif\n    #ifdef INPUT_BLUE\n        offset=getOffset(offset);\n        x=offset.b*amountX+texCoord.x;\n        y=offset.b*amountY+texCoord.y;\n    #endif\n    #ifdef INPUT_LUMINANCE\n        float o=dot(vec3(0.2126,0.7152,0.0722), offset);\n        o=getOffset(o);\n        x=o*amountX+texCoord.x;\n        y=o*amountY+texCoord.y;\n    #endif\n    #ifdef WRAP_CLAMP\n        x=clamp(x,0.0,1.0);\n        y=clamp(y,0.0,1.0);\n    #endif\n    #ifdef WRAP_REPEAT\n        x=mod(x,1.0);\n        y=mod(y,1.0);\n    #endif\n    #ifdef WRAP_MIRROR\n        float mx=mod(x,2.0);\n        float my=mod(y,2.0);\n        x=abs((floor(mx)-fract(mx)));\n        y=abs((floor(my)-fract(my)));\n    #endif\n\n\n\n    vec4 col=texture(tex,vec2(x,y));\n    vec4 base=texture(tex,texCoord);\n\n    outColor=cgl_blend(base,col,amount);\n}",};
const
    render=op.inTrigger("render"),
    displaceTex=op.inTexture("displaceTex"),
    blendMode=CGL.TextureEffect.AddBlendSelect(op,"Blend Mode","normal"),
    amount=op.inValueSlider("Amount",1),
    amountX=op.inValueSlider("amount X",0.2),
    amountY=op.inValueSlider("amount Y",0.2),
    inWrap=op.inSwitch("Wrap",["Mirror","Clamp","Repeat"],"Mirror"),
    inInput=op.inValueSelect("Input",["Luminance","RedGreen","Red","Green","Blue"],"Luminance"),
    inZero=op.inSwitch("Zero Displace",["Grey","Black"],"Grey"),
    // displaceTex=op.inTexture("displaceTex"),
    trigger=op.outTrigger("trigger");

op.setPortGroup("Axis Displacement Strength",[amountX,amountY]);
op.setPortGroup("Modes",[inWrap,inInput]);
op.toWorkPortsNeedToBeLinked(displaceTex);

const
    cgl=op.patch.cgl,
    shader=new CGL.Shader(cgl);

shader.setSource(shader.getDefaultVertexShader(),attachments.pixeldisplace3_frag);

const
    textureUniform=new CGL.Uniform(shader,'t','tex',0),
    textureDisplaceUniform=new CGL.Uniform(shader,'t','displaceTex',1),
    amountXUniform=new CGL.Uniform(shader,'f','amountX',amountX),
    amountYUniform=new CGL.Uniform(shader,'f','amountY',amountY),
    amountUniform=new CGL.Uniform(shader,'f','amount',amount);

inZero.onChange=updateZero;
inWrap.onChange=updateWrap;
inInput.onChange=updateInput;

updateWrap();
updateInput();
updateZero();

CGL.TextureEffect.setupBlending(op,shader,blendMode,amount);

function updateZero()
{
    shader.removeDefine("ZERO_BLACK");
    shader.removeDefine("ZERO_GREY");
    shader.define("ZERO_"+(inZero.get()+'').toUpperCase());
}

function updateWrap()
{
    shader.removeDefine("WRAP_CLAMP");
    shader.removeDefine("WRAP_REPEAT");
    shader.removeDefine("WRAP_MIRROR");
    shader.define("WRAP_"+(inWrap.get()+'').toUpperCase());
}

function updateInput()
{
    shader.removeDefine("INPUT_LUMINANCE");
    shader.removeDefine("INPUT_REDGREEN");
    shader.removeDefine("INPUT_RED");
    shader.define("INPUT_"+(inInput.get()+'').toUpperCase());
}

render.onTriggered=function()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex );
    if(displaceTex.get()) cgl.setTexture(1, displaceTex.get().tex );

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.TextureEffects.PixelDisplacement_v3.prototype = new CABLES.Op();
CABLES.OPS["c089646e-9324-48b2-8b32-81240408222e"]={f:Ops.Gl.TextureEffects.PixelDisplacement_v3,objName:"Ops.Gl.TextureEffects.PixelDisplacement_v3"};




// **************************************************************
// 
// Ops.Gl.Shader.BasicMaterial_v2
// 
// **************************************************************

Ops.Gl.Shader.BasicMaterial_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={basicmaterial_frag:"{{MODULES_HEAD}}\n\nIN vec2 texCoord;\nUNI vec4 color;\n// UNI float r;\n// UNI float g;\n// UNI float b;\n// UNI float a;\n\n#ifdef HAS_TEXTURES\n    IN vec2 texCoordOrig;\n    #ifdef HAS_TEXTURE_DIFFUSE\n        UNI sampler2D tex;\n    #endif\n    #ifdef HAS_TEXTURE_OPACITY\n        UNI sampler2D texOpacity;\n   #endif\n#endif\n\nvoid main()\n{\n    {{MODULE_BEGIN_FRAG}}\n    vec4 col=color;\n\n    #ifdef HAS_TEXTURES\n        // vec2 uv=vec2(texCoord.s,1.0-texCoord.t);\n        vec2 uv=texCoord;\n\n        #ifdef HAS_TEXTURE_DIFFUSE\n            col=texture(tex,uv);\n\n            #ifdef COLORIZE_TEXTURE\n                col.r*=color.r;\n                col.g*=color.g;\n                col.b*=color.b;\n            #endif\n        #endif\n        col.a*=color.a;\n        #ifdef HAS_TEXTURE_OPACITY\n            #ifdef TRANSFORMALPHATEXCOORDS\n                // uv=vec2(texCoordOrig.s,1.0-texCoordOrig.t);\n                uv=texCoordOrig;\n            #endif\n            #ifdef ALPHA_MASK_ALPHA\n                col.a*=texture(texOpacity,uv).a;\n            #endif\n            #ifdef ALPHA_MASK_LUMI\n                col.a*=dot(vec3(0.2126,0.7152,0.0722), texture(texOpacity,uv).rgb);\n            #endif\n            #ifdef ALPHA_MASK_R\n                col.a*=texture(texOpacity,uv).r;\n            #endif\n            #ifdef ALPHA_MASK_G\n                col.a*=texture(texOpacity,uv).g;\n            #endif\n            #ifdef ALPHA_MASK_B\n                col.a*=texture(texOpacity,uv).b;\n            #endif\n            // #endif\n        #endif\n    #endif\n\n    {{MODULE_COLOR}}\n\n    #ifdef DISCARDTRANS\n        if(col.a<0.2) discard;\n    #endif\n\n    outColor = col;\n}\n",basicmaterial_vert:"IN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN vec3 attrVertNormal;\nIN float attrVertIndex;\n\n{{MODULES_HEAD}}\n\nOUT vec3 norm;\nOUT vec2 texCoord;\nOUT vec2 texCoordOrig;\n\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\n\n#ifdef HAS_TEXTURES\n    UNI float diffuseRepeatX;\n    UNI float diffuseRepeatY;\n    UNI float texOffsetX;\n    UNI float texOffsetY;\n#endif\n\nvoid main()\n{\n    mat4 mMatrix=modelMatrix;\n    mat4 mvMatrix;\n\n    norm=attrVertNormal;\n    texCoordOrig=vec2(attrTexCoord.x,1.0-attrTexCoord.y);\n    texCoord=vec2(attrTexCoord.x,1.0-attrTexCoord.y);\n    #ifdef HAS_TEXTURES\n        texCoord.x=texCoord.x*diffuseRepeatX+texOffsetX;\n        texCoord.y=texCoord.y*diffuseRepeatY+texOffsetY;\n    #endif\n\n    vec4 pos = vec4(vPosition, 1.0);\n\n    #ifdef BILLBOARD\n       vec3 position=vPosition;\n       mvMatrix=viewMatrix*modelMatrix;\n\n       gl_Position = projMatrix * mvMatrix * vec4((\n           position.x * vec3(\n               mvMatrix[0][0],\n               mvMatrix[1][0],\n               mvMatrix[2][0] ) +\n           position.y * vec3(\n               mvMatrix[0][1],\n               mvMatrix[1][1],\n               mvMatrix[2][1]) ), 1.0);\n    #endif\n\n    {{MODULE_VERTEX_POSITION}}\n\n    #ifndef BILLBOARD\n        mvMatrix=viewMatrix * mMatrix;\n    #endif\n\n\n    #ifndef BILLBOARD\n        // gl_Position = projMatrix * viewMatrix * modelMatrix * pos;\n        gl_Position = projMatrix * mvMatrix * pos;\n    #endif\n}\n",};
const render=op.inTrigger("render");
const trigger=op.outTrigger('trigger');
const shaderOut=op.outObject("shader");
shaderOut.ignoreValueSerialize=true;

const cgl=op.patch.cgl;

op.toWorkPortsNeedToBeLinked(render);

const shader=new CGL.Shader(cgl,"basicmaterialnew");
shader.setModules(['MODULE_VERTEX_POSITION','MODULE_COLOR','MODULE_BEGIN_FRAG']);
// shader.bindTextures=bindTextures;
shader.setSource(attachments.basicmaterial_vert,attachments.basicmaterial_frag);
shaderOut.set(shader);

render.onTriggered=doRender;

// function bindTextures()
// {
//     // if(diffuseTexture.get()) cgl.setTexture(0, diffuseTexture.get().tex);
//     // if(textureOpacity.get()) cgl.setTexture(1, textureOpacity.get().tex);
// }

op.preRender=function()
{
    shader.bind();
    doRender();
};

function doRender()
{
    if(!shader)return;

    cgl.pushShader(shader);
    // shader.bindTextures();
    shader.popTextures();

    if(diffuseTextureUniform && diffuseTexture.get()) shader.pushTexture(diffuseTextureUniform,diffuseTexture.get().tex);
    if(textureOpacityUniform && textureOpacity.get()) shader.pushTexture(textureOpacityUniform,textureOpacity.get().tex);
    trigger.trigger();


    cgl.popShader();
}

// rgba colors
const r=op.inValueSlider("r",Math.random());
const g=op.inValueSlider("g",Math.random());
const b=op.inValueSlider("b",Math.random());
const a=op.inValueSlider("a",1);
r.setUiAttribs({"colorPick":true});

const uniColor=new CGL.Uniform(shader,'4f','color',r,g,b,a);

op.setPortGroup("Color",[r,g,b,a]);

// diffuse outTexture

var diffuseTexture=op.inTexture("texture");
var diffuseTextureUniform=null;
// shader.bindTextures=bindTextures;

diffuseTexture.onChange=updateDiffuseTexture;

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

const colorizeTexture=op.inValueBool("colorizeTexture",false);

op.setPortGroup("Color Texture",[diffuseTexture,colorizeTexture]);

// opacity texture
var textureOpacity=op.inTexture("textureOpacity");
var textureOpacityUniform=null;

op.alphaMaskSource=op.inSwitch("Alpha Mask Source",["Luminance","R","G","B","A"],"Luminance");
op.alphaMaskSource.onChange=updateAlphaMaskMethod;
op.alphaMaskSource.setUiAttribs({greyout:true});

function updateAlphaMaskMethod()
{
    if(op.alphaMaskSource.get()=='A') shader.define('ALPHA_MASK_ALPHA');
        else shader.removeDefine('ALPHA_MASK_ALPHA');

    if(op.alphaMaskSource.get()=='Luminance') shader.define('ALPHA_MASK_LUMI');
        else shader.removeDefine('ALPHA_MASK_LUMI');

    if(op.alphaMaskSource.get()=='R') shader.define('ALPHA_MASK_R');
        else shader.removeDefine('ALPHA_MASK_R');

    if(op.alphaMaskSource.get()=='G') shader.define("ALPHA_MASK_G");
        else shader.removeDefine('ALPHA_MASK_G');

    if(op.alphaMaskSource.get()=='B') shader.define('ALPHA_MASK_B');
        else shader.removeDefine('ALPHA_MASK_B');
}

textureOpacity.onChange=updateOpacity;
function updateOpacity()
{

    if(textureOpacity.get())
    {
        if(textureOpacityUniform!==null)return;
        shader.removeUniform('texOpacity');
        shader.define('HAS_TEXTURE_OPACITY');
        if(!textureOpacityUniform)textureOpacityUniform=new CGL.Uniform(shader,'t','texOpacity',1);

        op.alphaMaskSource.setUiAttribs({greyout:false});
        discardTransPxl.setUiAttribs({greyout:false});
        texCoordAlpha.setUiAttribs({greyout:false});

    }
    else
    {
        shader.removeUniform('texOpacity');
        shader.removeDefine('HAS_TEXTURE_OPACITY');
        textureOpacityUniform=null;

        op.alphaMaskSource.setUiAttribs({greyout:true});
        discardTransPxl.setUiAttribs({greyout:true});
        texCoordAlpha.setUiAttribs({greyout:true});
    }
    updateAlphaMaskMethod();
};


var texCoordAlpha=op.inValueBool("Opacity TexCoords Transform",false);
const discardTransPxl=op.inValueBool("Discard Transparent Pixels");

discardTransPxl.onChange=function()
{
    if(discardTransPxl.get()) shader.define('DISCARDTRANS');
        else shader.removeDefine('DISCARDTRANS');
};


texCoordAlpha.onChange=function()
{
    if(texCoordAlpha.get()) shader.define('TRANSFORMALPHATEXCOORDS');
        else shader.removeDefine('TRANSFORMALPHATEXCOORDS');
};

op.setPortGroup("Opacity",[textureOpacity,op.alphaMaskSource,discardTransPxl,texCoordAlpha]);


colorizeTexture.onChange=function()
{
    if(colorizeTexture.get()) shader.define('COLORIZE_TEXTURE');
        else shader.removeDefine('COLORIZE_TEXTURE');
};




// texture coords

const diffuseRepeatX=op.inValue("diffuseRepeatX",1);
const diffuseRepeatY=op.inValue("diffuseRepeatY",1);
const diffuseOffsetX=op.inValue("Tex Offset X",0);
const diffuseOffsetY=op.inValue("Tex Offset Y",0);

const diffuseRepeatXUniform=new CGL.Uniform(shader,'f','diffuseRepeatX',diffuseRepeatX);
const diffuseRepeatYUniform=new CGL.Uniform(shader,'f','diffuseRepeatY',diffuseRepeatY);
const diffuseOffsetXUniform=new CGL.Uniform(shader,'f','texOffsetX',diffuseOffsetX);
const diffuseOffsetYUniform=new CGL.Uniform(shader,'f','texOffsetY',diffuseOffsetY);

op.setPortGroup("Texture Transform",[diffuseRepeatX,diffuseRepeatY,diffuseOffsetX,diffuseOffsetY]);



const doBillboard=op.inValueBool("billboard",false);

doBillboard.onChange=function()
{
    if(doBillboard.get()) shader.define('BILLBOARD');
        else shader.removeDefine('BILLBOARD');
};

updateOpacity();
updateDiffuseTexture();

};

Ops.Gl.Shader.BasicMaterial_v2.prototype = new CABLES.Op();
CABLES.OPS["51f2207b-daaa-447f-bdbe-87fdd72f0c40"]={f:Ops.Gl.Shader.BasicMaterial_v2,objName:"Ops.Gl.Shader.BasicMaterial_v2"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.WaveformGradient
// 
// **************************************************************

Ops.Gl.TextureEffects.WaveformGradient = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={waveform_frag:"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI float uFreq;\nUNI float uOffset;\nUNI float uPow;\nUNI float uRotate;\nUNI float amount;\n\nUNI float r;\nUNI float g;\nUNI float b;\n\n{{CGL.BLENDMODES}}\n\n#define PI 3.14159265359\n#define TAU (2.0 * PI)\n\nvoid pR(inout vec2 p, float a)\n{\n    float s = sin(a),c=cos(a); p *= mat2(c,s,-s,c);\n}\n\nfloat pModMirror1(inout float p, float size) {\n\tfloat halfsize = size * 0.5;\n\tfloat c = floor((p + halfsize)/size);\n\tp = mod(p + halfsize,size) - halfsize;\n\tp *= mod(c, 2.0) * 2.0 - 1.0;\n\treturn c;\n}\n\nvoid main()\n{\n    vec2 uv = texCoord;\n    float v = 0.0;\n\n    uv -= 0.5;\n    pR(uv,TAU * uRotate);\n    uv += 0.5 + uOffset;\n\n    uv.x *= uFreq;\n\n    #ifdef MODE_SINE\n        uv.x += 0.5;\n        pModMirror1(uv.x,1.0);\n        v = pow(cos(PI * uv.x / 2.0),uPow);\n    #endif\n\n    #ifdef MODE_SAW\n        uv.x = mod(uv.x,1.0);\n        v = pow(min(cos(PI * uv.x /2.0),1.0 - abs(uv.x)),uPow);\n    #endif\n\n    #ifdef MODE_TRI\n        uv.x += 0.5;\n        pModMirror1(uv.x,1.0);\n        uv.x = -abs(uv.x);\n        uv.x = fract(uv.x);\n        v = pow(uv.x,uPow);\n    #endif\n\n    #ifdef MODE_SQR\n        pModMirror1(uv.x,1.0);\n        uv.x = -abs(uv.x);\n        uv.x = fract(uv.x);\n        v = step(uv.x,uPow);\n    #endif\n\n    vec4 col = vec4(vec3(v)*vec3(r,g,b),1.0);\n    vec4 base = texture(tex,texCoord);\n\n    outColor = cgl_blend(base,col,amount);;\n}\n",};
const
    render=op.inTrigger("render"),
    blendMode=CGL.TextureEffect.AddBlendSelect(op,"Blend Mode","normal"),
    amount=op.inValueSlider("Amount",1),
    mode=op.inValueSelect("Mode",['Sine','Sawtooth','Triangle','Square'],'Sine'),
    freq=op.inValue("Frequency",4),
    pow=op.inValue("Pow factor",6),
    offset=op.inValue("Offset",0),
    rotate=op.inFloatSlider("Rotate",0),
    r=op.inValueSlider("r", 1.0),
    g=op.inValueSlider("g", 1.0),
    b=op.inValueSlider("b", 1.0),
    trigger=op.outTrigger("trigger");

op.setPortGroup("Waveform",[mode,freq,pow,offset,rotate]);
op.setPortGroup("Color",[r,g,b]);

r.setUiAttribs({ colorPick: true });

const cgl=op.patch.cgl;
const shader=new CGL.Shader(cgl);

shader.setSource(shader.getDefaultVertexShader(),attachments.waveform_frag );

mode.onChange=updateMode;

const
    textureUniform=new CGL.Uniform(shader,'t','tex',0),
    freqUniform=new CGL.Uniform(shader,'f','uFreq',freq),
    offsetUniform=new CGL.Uniform(shader,'f','uOffset',offset),
    powUniform=new CGL.Uniform(shader,'f','uPow',pow),
    rotateUniform=new CGL.Uniform(shader,'f','uRotate',rotate),
    amountUniform=new CGL.Uniform(shader,'f','amount',amount),
    uniformR=new CGL.Uniform(shader,'f','r',r),
    uniformG=new CGL.Uniform(shader,'f','g',g),
    uniformB=new CGL.Uniform(shader,'f','b',b);

updateMode();

CGL.TextureEffect.setupBlending(op,shader,blendMode,amount);

function updateMode()
{
    shader.removeDefine("MODE_SAW");
    shader.removeDefine("MODE_SINE");
    shader.removeDefine("MODE_TRI");
    shader.removeDefine("MODE_SQR");

    if(mode.get()=='Sine')shader.define("MODE_SINE");
    else if(mode.get()=='Sawtooth')shader.define("MODE_SAW");
    else if(mode.get()=='Triangle')shader.define("MODE_TRI");
    else if(mode.get()=='Square')shader.define("MODE_SQR");

}

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

Ops.Gl.TextureEffects.WaveformGradient.prototype = new CABLES.Op();
CABLES.OPS["d8d0ab9a-3cd9-4f91-9d9f-953b515c7c7f"]={f:Ops.Gl.TextureEffects.WaveformGradient,objName:"Ops.Gl.TextureEffects.WaveformGradient"};




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




// **************************************************************
// 
// Ops.Anim.RandomAnim
// 
// **************************************************************

Ops.Anim.RandomAnim = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var exe=op.inTrigger("exe");

var min=op.inValue("min",0);
var max=op.inValue("max",1);
var seed=op.inValue("random seed",0);

var duration=op.inValue("duration",0.5);
var pause=op.inValue("pause between",0);
var next=op.outTrigger("Next");
var result=op.outValue("result");
var looped=op.outTrigger("Looped");

var anim=new CABLES.Anim();
anim.createPort(op,"easing",reinit);

op.setPortGroup("Timing",[duration,pause]);
op.setPortGroup("Value",[min,max,seed]);

op.toWorkPortsNeedToBeLinked(exe);

var counter=0;

min.onChange=
max.onChange=
pause.onChange=
seed.onChange=
duration.onChange=reinitLater;

var needsReinit=true;

function reinitLater()
{
    needsReinit=true;
}

function getRandom()
{
    var minVal = ( min.get() );
    return Math.seededRandom() * (  max.get()  - minVal ) + minVal;
}

function reinit()
{
    Math.randomSeed=seed.get()+counter*100;
    init(getRandom());
    needsReinit=false;
}

function init(v)
{
    anim.clear();

    anim.setValue(op.patch.freeTimer.get(), v);
    if(pause.get()!==0.0) anim.setValue(op.patch.freeTimer.get()+pause.get(), v);

    anim.setValue(duration.get()+op.patch.freeTimer.get()+pause.get(), getRandom());
}


exe.onTriggered=updateExe;

function updateExe()
{
    if(needsReinit)reinit();

    const t=op.patch.freeTimer.get();
    const v=anim.getValue(t);

    // console.log(t,anim.keys[anim.keys.length - 1].time);


    if(anim.hasEnded(t))
    {
        counter++;
        anim.clear();
        init(v);
        looped.trigger();
    }
    result.set(v);
    next.trigger();
};



};

Ops.Anim.RandomAnim.prototype = new CABLES.Op();
CABLES.OPS["2d2e5f0e-b69f-4789-9a48-1ee6ade5049a"]={f:Ops.Anim.RandomAnim,objName:"Ops.Anim.RandomAnim"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.Hue
// 
// **************************************************************

Ops.Gl.TextureEffects.Hue = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={hue_frag:"\n#ifdef HAS_TEXTURES\n  IN vec2 texCoord;\n  UNI sampler2D tex;\n#endif\nUNI float hue;\n\nvec3 rgb2hsv(vec3 c)\n{\n    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);\n    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));\n    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));\n\n    float d = q.x - min(q.w, q.y);\n    float e = 1.0e-10;\n    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);\n}\n\nvec3 hsv2rgb(vec3 c)\n{\n    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\n    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);\n    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);\n}\n\nvoid main()\n{\n   vec4 col=vec4(1.0,0.0,0.0,1.0);\n   #ifdef HAS_TEXTURES\n       col=texture(tex,texCoord);\n\n       vec3 hsv = rgb2hsv(col.rgb);\n       hsv.x=hsv.x+hue;\n       col.rgb = hsv2rgb(hsv);\n\n   #endif\n   outColor= col;\n}",};
const
    render=op.inTrigger('render'),
    hue=op.inValueSlider("hue",1),
    trigger=op.outTrigger('trigger');

const cgl=op.patch.cgl;
const shader=new CGL.Shader(cgl);

shader.setSource(shader.getDefaultVertexShader(),attachments.hue_frag);
const textureUniform=new CGL.Uniform(shader,'t','tex',0);
const uniformHue=new CGL.Uniform(shader,'f','hue',1.0);

hue.onChange=function(){ uniformHue.setValue(hue.get()); };

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

Ops.Gl.TextureEffects.Hue.prototype = new CABLES.Op();
CABLES.OPS["94ef0da0-c920-415c-81b0-fecbd437991d"]={f:Ops.Gl.TextureEffects.Hue,objName:"Ops.Gl.TextureEffects.Hue"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.Stripes_v2
// 
// **************************************************************

Ops.Gl.TextureEffects.Stripes_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={stripes_frag:"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI float amount;\nUNI float num;\nUNI float width;\nUNI float axis;\nUNI float offset;\nUNI float rotate;\n\nUNI float r;\nUNI float g;\nUNI float b;\n\n\n{{CGL.BLENDMODES}}\n\n#define PI 3.14159265\n#define TAU (2.0*PI)\n\nvoid pR(inout vec2 p, float a)\n{\n\tp = cos(a)*p + sin(a)*vec2(p.y, -p.x);\n}\nvoid main()\n{\n    vec2 uv = texCoord-0.5;\n    pR(uv.xy,rotate*TAU);\n    vec4 stripe=vec4(0.0);\n\n    float v=0.0;\n    float c=1.0;\n    v=uv.y;\n    v+=offset;\n\n    float m=mod(v,1.0/num);\n\n    #ifdef CIRCULAR\n        m=mod((length(uv)+offset)*1.5,1.0/num);\n    #endif\n\n    float rm=width*2.0*1.0/num/2.0;\n\n    if(m>rm)\n       stripe.rgb=mix(stripe.rgb,vec3( r,g,b ),1.0);\n\n    #ifdef STRIPES_SMOOTHED\n       m*=2.0;\n       stripe.rgb= vec3(r,g,b) * vec3(smoothstep(0.,1., abs(( ((m-rm) )/ (rm) )  ) ));\n       //stripe.rgb= vec3(smoothstep(0.,1., abs(( ((m-rm) )/ (rm) )  ) ));\n    #endif\n\n    //blend section\n    vec4 col=vec4(stripe.rgb,1.0);\n    vec4 base=texture(tex,texCoord);\n\n    outColor=cgl_blend(base,col,amount);\n}\n",};
const
    render=op.inTrigger('Render'),
    blendMode=CGL.TextureEffect.AddBlendSelect(op,"Blend Mode","normal"),
    amount=op.inValueSlider("Amount",1),
    num=op.inValue("Num",5),
    width=op.inValue("Width",0.5),
    rotate=op.inValueSlider("Rotate",0),
    offset=op.inValue("Offset",0),
    smoothed=op.inValueBool("Gradients"),
    circular=op.inValueBool("Circular"),
    r=op.inValueSlider("r", Math.random()),
    g=op.inValueSlider("g", Math.random()),
    b=op.inValueSlider("b", Math.random()),
    trigger=op.outTrigger('trigger');

r.setUiAttribs({ colorPick: true });

smoothed.onChange=updateDefines;
circular.onChange=updateDefines;

function updateDefines()
{

    shader.toggleDefine("STRIPES_SMOOTHED",smoothed.get());
    shader.toggleDefine("CIRCULAR",circular.get());
}


const
    cgl=op.patch.cgl,
    shader=new CGL.Shader(cgl,'textureeffect stripes');

shader.setSource(shader.getDefaultVertexShader(),attachments.stripes_frag);

const
    textureUniform=new CGL.Uniform(shader,'t','tex',0),
    amountUniform=new CGL.Uniform(shader,'f','amount',amount),
    rotateUniform=new CGL.Uniform(shader,'f','rotate',rotate),
    numUniform=new CGL.Uniform(shader,'f','num',num),
    uniWidth=new CGL.Uniform(shader,'f','width',width),
    uniOffset=new CGL.Uniform(shader,'f','offset',offset),
    uniformR=new CGL.Uniform(shader,'f','r',r),
    uniformG=new CGL.Uniform(shader,'f','g',g),
    uniformB=new CGL.Uniform(shader,'f','b',b);

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

Ops.Gl.TextureEffects.Stripes_v2.prototype = new CABLES.Op();
CABLES.OPS["b8a37747-1e84-4665-b1cc-29256d55cc7c"]={f:Ops.Gl.TextureEffects.Stripes_v2,objName:"Ops.Gl.TextureEffects.Stripes_v2"};




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
// Ops.Math.Compare.GreaterThan
// 
// **************************************************************

Ops.Math.Compare.GreaterThan = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    result=op.outValue("result"),
    number1=op.inValueFloat("number1"),
    number2=op.inValueFloat("number2");

number1.onChange=number2.onChange=exec;

function exec()
{
    result.set(number1.get()>number2.get());
}



};

Ops.Math.Compare.GreaterThan.prototype = new CABLES.Op();
CABLES.OPS["b250d606-f7f8-44d3-b099-c29efff2608a"]={f:Ops.Math.Compare.GreaterThan,objName:"Ops.Math.Compare.GreaterThan"};




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
// Ops.Gl.TextureEffects.ScaleTexture
// 
// **************************************************************

Ops.Gl.TextureEffects.ScaleTexture = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={scale_frag:"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI sampler2D multiplierTex;\nUNI float amount;\nUNI float uScaleX,uScaleY;\nUNI float offsetX,offsetY;\nUNI float centerX,centerY;\n\n{{CGL.BLENDMODES}}\n\nvoid main()\n{\n    float multiplier = 1.0;\n    vec2 uv = texCoord;\n\n    #ifdef MASK_SCALE\n        multiplier = dot(vec3(0.2126,0.7152,0.0722), texture(multiplierTex,texCoord).rgb);\n    #endif\n\n    uv.x = (uv.x - centerX) / (uScaleX * multiplier)  + centerX+offsetX ;\n    uv.y = (uv.y - centerY) / (uScaleY * multiplier)  + centerY+offsetY ;\n\n    //blend section\n    vec4 col = texture(tex,uv);\n    //original texture\n    vec4 base = texture(tex,texCoord);\n\n    //blend stuff\n\n    outColor=cgl_blend(base,col,amount);\n}\n",};
const
    render=op.inTrigger("render"),
    multiplierTex = op.inTexture("Multiplier"),
    blendMode=CGL.TextureEffect.AddBlendSelect(op,"Blend Mode","normal"),
    amount=op.inValueSlider("Amount",1),
    scaleX=op.inValue("Scale X",1.5),
    scaleY=op.inValue("Scale Y",1.5),
    offsetX=op.inValueSlider("offset X",0),
    offsetY=op.inValueSlider("offset Y",0),
    centerX=op.inValueSlider("center X",0.5),
    centerY=op.inValueSlider("center Y",0.5),
    trigger=op.outTrigger("trigger");

const cgl=op.patch.cgl;
const shader=new CGL.Shader(cgl);

shader.setSource(shader.getDefaultVertexShader(),attachments.scale_frag);

const
    textureUniform=new CGL.Uniform(shader,'t','tex',0),
    textureMultiplierUniform=new CGL.Uniform(shader,'t','multiplierTex',1),
    amountUniform=new CGL.Uniform(shader,'f','amount',amount),
    scaleXUniform=new CGL.Uniform(shader,'f','uScaleX',scaleX),
    scaleYUniform=new CGL.Uniform(shader,'f','uScaleY',scaleY),
    centerXUniform=new CGL.Uniform(shader,'f','centerX',centerX),
    centerYUniform=new CGL.Uniform(shader,'f','centerY',centerY),
    offsetXUniform=new CGL.Uniform(shader,'f','offsetX',offsetX),
    offsetYUniform=new CGL.Uniform(shader,'f','offsetY',offsetY);

CGL.TextureEffect.setupBlending(op,shader,blendMode,amount);

multiplierTex.onChange = function()
{
    shader.toggleDefine('MASK_SCALE',multiplierTex.isLinked());
}

render.onTriggered=function()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

    if(multiplierTex.get()) cgl.setTexture(1, multiplierTex.get().tex );

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};



};

Ops.Gl.TextureEffects.ScaleTexture.prototype = new CABLES.Op();
CABLES.OPS["12cfa989-d575-4ee2-9deb-5392097c5a27"]={f:Ops.Gl.TextureEffects.ScaleTexture,objName:"Ops.Gl.TextureEffects.ScaleTexture"};




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
// Ops.Gl.Perspective
// 
// **************************************************************

Ops.Gl.Perspective = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
// http://stackoverflow.com/questions/5504635/computing-fovx-opengl

var render=op.inTrigger('render');
var fovY=op.inValueFloat("fov y",45);
var zNear=op.inValueFloat("frustum near",0.01);
var zFar=op.inValueFloat("frustum far",20);
var autoAspect=op.inValueBool("Auto Aspect Ratio",true);
var aspect=op.inValue("Aspect Ratio");

var trigger=op.outTrigger('trigger');


var cgl=op.patch.cgl;

fovY.onChange=zFar.onChange=zNear.onChange=changed;

changed();

op.setPortGroup("Field of View",fovY);
op.setPortGroup("Frustrum",zNear,zFar);

var asp=0;

render.onTriggered=function()
{
    asp=cgl.getViewPort()[2]/cgl.getViewPort()[3];
    if(!autoAspect.get())asp=aspect.get();

    cgl.pushPMatrix();
    mat4.perspective(
        cgl.pMatrix,
        fovY.get()*0.0174533,
        asp,
        zNear.get(),
        zFar.get());

    trigger.trigger();

    cgl.popPMatrix();
};

function changed()
{
    cgl.frameStore.perspective=
    {
        fovy:fovY.get(),
        zFar:zFar.get(),
        zNear:zNear.get(),
    };
}



};

Ops.Gl.Perspective.prototype = new CABLES.Op();
CABLES.OPS["7a78e163-d28c-4f70-a6d0-6d952da79f50"]={f:Ops.Gl.Perspective,objName:"Ops.Gl.Perspective"};




// **************************************************************
// 
// Ops.Boolean.ToggleBool
// 
// **************************************************************

Ops.Boolean.ToggleBool = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    trigger=op.inTriggerButton("trigger"),
    reset=op.inTriggerButton("reset"),
    outBool=op.outValue("result");

var theBool=false;
outBool.set(theBool);
outBool.ignoreValueSerialize=true;

trigger.onTriggered=function()
{
    theBool=!theBool;
    outBool.set(theBool);
};

reset.onTriggered=function()
{
    theBool=false;
    outBool.set(theBool);
};



};

Ops.Boolean.ToggleBool.prototype = new CABLES.Op();
CABLES.OPS["712a25f4-3a93-4042-b8c5-2f56169186cc"]={f:Ops.Boolean.ToggleBool,objName:"Ops.Boolean.ToggleBool"};




// **************************************************************
// 
// Ops.Devices.Keyboard.KeyPressLearn
// 
// **************************************************************

Ops.Devices.Keyboard.KeyPressLearn = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var learnedKeyCode = op.inValueInt("key code");
var canvasOnly=op.inValueBool("canvas only");
var modKey=op.inValueSelect("Mod Key",['none','alt'],"none");
var inEnable=op.inValueBool("Enabled",true);
var preventDefault=op.inValueBool("Prevent Default");
var learn = op.inTriggerButton("learn");
var onPress=op.outTrigger("on press");
var onRelease=op.outTrigger("on release");
var outPressed=op.outValue("Pressed",false);

const cgl=op.patch.cgl;
var learning = false;

function onKeyDown(e)
{
    if(learning){
        learnedKeyCode.set(e.keyCode);
        if(CABLES.UI){
            gui.patch().showOpParams(op);
        }
        // op.log("Learned key code: " + learnedKeyCode.get());
        learning = false;
        removeListeners();
        addListener();
    } else {
        if(e.keyCode == learnedKeyCode.get()){

            if(modKey.get()=='alt' )
            {
                if(e.altKey===true)
                {
                    onPress.trigger();
                    outPressed.set(true);
                    if(preventDefault.get())e.preventDefault();
                }
            }
            else
            {
                onPress.trigger();
                outPressed.set(true);
                if(preventDefault.get())e.preventDefault();
            }

        }
    }
}

function onKeyUp(e) {
    if(e.keyCode == learnedKeyCode.get()) {
        // op.log("Key released, key code: " + e.keyCode);
        onRelease.trigger();
        outPressed.set(false);
    }
}

op.onDelete=function()
{
    cgl.canvas.removeEventListener('keyup', onKeyUp, false);
    cgl.canvas.removeEventListener('keydown', onKeyDown, false);
    document.removeEventListener("keyup", onKeyUp, false);
    document.removeEventListener("keydown", onKeyDown, false);
};

learn.onTriggered = function(){
    // op.log("Listening for key...");
    learning = true;
    addDocumentListener();

    setTimeout(function(){
        learning = false;
        removeListeners();
        addListener();
    }, 3000);
};

function addListener() {
    if(canvasOnly.get() === true) {
        addCanvasListener();
    } else {
        addDocumentListener();
    }
}

function removeListeners() {
    document.removeEventListener("keydown", onKeyDown, false);
    document.removeEventListener("keyup", onKeyUp, false);
    cgl.canvas.removeEventListener('keydown', onKeyDown, false);
    cgl.canvas.removeEventListener('keyup', onKeyUp, false);
    outPressed.set(false);
}

function addCanvasListener() {
    cgl.canvas.addEventListener("keydown", onKeyDown, false );
    cgl.canvas.addEventListener("keyup", onKeyUp, false );
}

function addDocumentListener() {
    document.addEventListener("keydown", onKeyDown, false);
    document.addEventListener("keyup", onKeyUp, false);
}

inEnable.onChange=function()
{
    if(!inEnable.get())
    {
        removeListeners();
    }
    else
    {
        addListener();
    }
}

canvasOnly.onChange=function(){
    removeListeners();
    addListener();
};

canvasOnly.set(true);
addCanvasListener();


};

Ops.Devices.Keyboard.KeyPressLearn.prototype = new CABLES.Op();
CABLES.OPS["f069c0db-4051-4eae-989e-6ef7953787fd"]={f:Ops.Devices.Keyboard.KeyPressLearn,objName:"Ops.Devices.Keyboard.KeyPressLearn"};




// **************************************************************
// 
// Ops.User.timothe.FeedBackDelay
// 
// **************************************************************

Ops.User.timothe.FeedBackDelay = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
//empty file...
CABLES.WEBAUDIO.createAudioContext(op);

// vars
var node = new Tone.FeedbackDelay();

// default values
var DELAY_TIME_DEFAULT = 0.25;
var DELAY_TIME_MIN = 0.0;
var DELAY_TIME_MAX = 1.0;
var FEEDBACK_DEFAULT = 0.1; // ?
var FEEDBACK_MIN = 0.0; // ?
var FEEDBACK_MAX = 1.0; // ?
var WET_DEFAULT = 1.0;
var WET_MIN = 0.0;
var WET_MAX = 1.0;

// input ports
var audioInPort = CABLES.WEBAUDIO.createAudioInPort(op, "Audio In", node);
var delayTimePort = CABLES.WEBAUDIO.createAudioParamInPort(op, "Delay Time", node.delayTime, {"display": "range", "min": DELAY_TIME_MIN, "max": DELAY_TIME_MAX}, DELAY_TIME_DEFAULT);
var feedbackPort = CABLES.WEBAUDIO.createAudioParamInPort(op, "Feedback", node.feedback, {"display": "range", "min": FEEDBACK_MIN, "max": FEEDBACK_MAX}, FEEDBACK_DEFAULT);
var wetPort = CABLES.WEBAUDIO.createAudioParamInPort(op, "Wet", node.wet, {"display": "range", "min": WET_MIN, "max": WET_MAX}, WET_DEFAULT);

// output ports
var audioOutPort = CABLES.WEBAUDIO.createAudioOutPort(op, "Audio Out", node);

// clean up
op.onDelete = function() {
    node.dispose();
};

};

Ops.User.timothe.FeedBackDelay.prototype = new CABLES.Op();





// **************************************************************
// 
// Ops.User.timothe.Distorsion
// 
// **************************************************************

Ops.User.timothe.Distorsion = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
CABLES.WEBAUDIO.createAudioContext(op);

// vars
var node = new Tone.Distortion();

// default values
var DISTORTION_DEFAULT = 0.4;
var DISTORTION_MIN = 0.0;
var DISTORTION_MAX = 1.0;
var OVERSAMPLE_VALUES = ["none", "2x", "4x"];
var OVERSAMPLE_DEFAULT = "none";
var WET_DEFAULT = 1.0;
var WET_MIN = 0.0;
var WET_MAX = 1.0;

// input ports
var audioInPort = CABLES.WEBAUDIO.createAudioInPort(op, "Audio In", node);
var distortionPort = op.addInPort( new CABLES.Port( op, "Distortion", CABLES.OP_PORT_TYPE_VALUE, { 'display': 'range', 'min': DISTORTION_MIN, 'max': DISTORTION_MAX } ));
distortionPort.set(DISTORTION_DEFAULT);
var oversamplePort = op.addInPort( new CABLES.Port( op, "Oversample", CABLES.OP_PORT_TYPE_VALUE, { display: 'dropdown', values: OVERSAMPLE_VALUES } ) );
oversamplePort.set(OVERSAMPLE_DEFAULT);
var wetPort = CABLES.WEBAUDIO.createAudioParamInPort(op, "Wet", node.wet, {"display": "range", "min": WET_MIN, "max": WET_MAX}, WET_DEFAULT);

// change listeners
distortionPort.onChange = function() {
    var distortion = distortionPort.get();
    if(distortion) {
        if(distortion >= DISTORTION_MIN && distortion <= DISTORTION_MAX) {
            setNodeValue("distortion", distortion);
        }
    }
};
oversamplePort.onChange = function() {
    var oversample = oversamplePort.get();
    if(oversample && OVERSAMPLE_VALUES.indexOf(oversample) > -1) {
        setNodeValue("oversample", oversample);
    }
};

// functions
function setNodeValue(key, val) {
    if(key && typeof val !== 'undefined') {
        node.set(key, val);
    }
}

// output ports
var audioOutPort = CABLES.WEBAUDIO.createAudioOutPort(op, "Audio Out", node);



};

Ops.User.timothe.Distorsion.prototype = new CABLES.Op();





// **************************************************************
// 
// Ops.User.timothe.Equalizer
// 
// **************************************************************

Ops.User.timothe.Equalizer = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};

CABLES.WEBAUDIO.createAudioContext(op);

// vars
var node = new Tone.EQ3();

// defaults
var DECIBELS_MIN = -100;
var DECIBELS_MAX = 0;
var FREQUENCY_MIN = 1;
var FREQUENCY_MAX = 20000;

var LOW_DEFAULT = 0;
var MID_DEFAULT = 0;
var HIGH_DEFAULT = 0;
var LOW_FREQUENCY_DEFAULT = 400;
var HIGH_FREQUENCY_DEFAULT = 2500;
var Q_DEFAULT = 1;
var Q_MIN = 1;
var Q_MAX = 45;


// input ports
var audioInPort = CABLES.WEBAUDIO.createAudioInPort(op, "Audio In", node);
var lowPort = CABLES.WEBAUDIO.createAudioParamInPort(op, "Low", node.low, {"display": "range", "min": DECIBELS_MIN, "max": DECIBELS_MAX}, LOW_DEFAULT);
var midPort = CABLES.WEBAUDIO.createAudioParamInPort(op, "Mid", node.mid, {"display": "range", "min": DECIBELS_MIN, "max": DECIBELS_MAX}, MID_DEFAULT);
var highPort = CABLES.WEBAUDIO.createAudioParamInPort(op, "High", node.high, {"display": "range", "min": DECIBELS_MIN, "max": DECIBELS_MAX}, HIGH_DEFAULT);
var qPort = CABLES.WEBAUDIO.createAudioParamInPort(op, "Q", node.Q, {"display": "range", "min": Q_MIN, "max": Q_MAX}, Q_DEFAULT);
var lowFrequencyPort = CABLES.WEBAUDIO.createAudioParamInPort(op, "Low Frequency", node.lowFrequency, {"display": "range", "min": FREQUENCY_MIN, "max": FREQUENCY_MAX}, LOW_FREQUENCY_DEFAULT);
var highFrequencyPort = CABLES.WEBAUDIO.createAudioParamInPort(op, "High Frequency", node.highFrequency, {"display": "range", "min": FREQUENCY_MIN, "max": FREQUENCY_MAX}, HIGH_FREQUENCY_DEFAULT);

// output ports
var audioOutPort = CABLES.WEBAUDIO.createAudioOutPort(op, "Audio Out", node);

// clean up
op.onDelete = function() {
    node.dispose();
};

};

Ops.User.timothe.Equalizer.prototype = new CABLES.Op();





// **************************************************************
// 
// Ops.WebAudio.BiquadFilter
// 
// **************************************************************

Ops.WebAudio.BiquadFilter = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
this.name="BiquadFilter";

var audioContext = CABLES.WEBAUDIO.createAudioContext(op);

// default values + min and max
var FREQUENCY_MIN = 10;
var FREQUENCY_MAX = audioContext.sampleRate / 2; // Nyquist frequency.
var TYPE_DEF = "allpass";

var biquadFilter = audioContext.createBiquadFilter();

var audioInPort = CABLES.WEBAUDIO.createAudioInPort(op, "Audio In", biquadFilter);
var audioOutPort = CABLES.WEBAUDIO.createAudioOutPort(op, "Audio Out", biquadFilter);

var type = op.inValueSelect ("type",['allpass','lowpass','highpass','bandpass','lowshelf','highshelf','peaking','notch'],'allpass');

var frequency = op.inFloat("frequency",1000);

var detune = op.inFloatSlider("detune",0);
var q = op.inFloatSlider("q",0);
var gain = op.inFloatSlider("gain",0.5);

var updateType = function(){
    biquadFilter.type = type.get();
};

var updateFrequency = function()
{
    var freq = frequency.get();
    if(freq && freq >= FREQUENCY_MIN && freq <= FREQUENCY_MAX)
    {
        biquadFilter.frequency.setValueAtTime(frequency.get(), window.audioContext.currentTime);
    }
};

var updateDetune = function()
{
    biquadFilter.detune.setValueAtTime(detune.get(), window.audioContext.currentTime);
};

var updateQ = function()
{
    biquadFilter.Q.setValueAtTime(q.get(), window.audioContext.currentTime);
};

var updateGain = function()
{
    biquadFilter.gain.setValueAtTime(gain.get(), window.audioContext.currentTime);
};

type.onChange=updateType;
frequency.onChange=updateFrequency;
detune.onChange=updateDetune;
q.onChange=updateQ;
gain.onChange=updateGain;

updateType();



};

Ops.WebAudio.BiquadFilter.prototype = new CABLES.Op();
CABLES.OPS["3e28f86a-4f74-49a2-a1a6-f8943c00352d"]={f:Ops.WebAudio.BiquadFilter,objName:"Ops.WebAudio.BiquadFilter"};




// **************************************************************
// 
// Ops.InteractionListener
// 
// **************************************************************

Ops.InteractionListener = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var duration=op.inValue("Duration",0.5);
var events=op.outValue("Events");

var timeout=0;

function afterEvent()
{
    events.set(false);
}

function onEvent()
{
    events.set(true);
    clearTimeout(timeout);
    timeout=setTimeout(afterEvent,duration.get()*1000);
}

var listenerElement=null;

function addListeners()
{
    listenerElement=op.patch.cgl.canvas;
    // if(area.get()=='Document') listenerElement=document.body;

    listenerElement.addEventListener('mousemove', onEvent);
    listenerElement.addEventListener('mouseleave', onEvent);
    listenerElement.addEventListener('mousedown', onEvent);
    listenerElement.addEventListener('mouseup', onEvent);
    listenerElement.addEventListener('mouseenter', onEvent);

}


function removeLiseteners()
{

    listenerElement.removeEventListener('mousemove', onEvent);
    listenerElement.removeEventListener('mouseleave', onEvent);
    listenerElement.removeEventListener('mousedown', onEvent);
    listenerElement.removeEventListener('mouseup', onEvent);
    listenerElement.removeEventListener('mouseenter', onEvent);
    listenerElement=null;
}


this.onDelete=function()
{
    removeLiseteners();
};

addListeners();

};

Ops.InteractionListener.prototype = new CABLES.Op();
CABLES.OPS["1dcb1c53-1e7f-41a6-9917-e625ea803f6c"]={f:Ops.InteractionListener,objName:"Ops.InteractionListener"};




// **************************************************************
// 
// Ops.Boolean.BoolToNumber
// 
// **************************************************************

Ops.Boolean.BoolToNumber = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    bool=op.inValueBool("bool"),
    number=op.outValue("number");

bool.onChange=function()
{
    if(bool.get()) number.set(1);
    else number.set(0);
};

};

Ops.Boolean.BoolToNumber.prototype = new CABLES.Op();
CABLES.OPS["2591c495-fceb-4f6e-937f-11b190c72ee5"]={f:Ops.Boolean.BoolToNumber,objName:"Ops.Boolean.BoolToNumber"};




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
// Ops.Math.Compare.Between
// 
// **************************************************************

Ops.Math.Compare.Between = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const number=op.inValue("value",2);
const number1=op.inValue("number1",1);
const number2=op.inValue("number2",3);
const result=op.outValue("result");

function exec()
{
    result.set
        (
            number.get() > Math.min(number1.get() , number2.get() )  &&
            number.get() < Math.max(number1.get() , number2.get() ) 
        );
}

number1.onChange=exec;
number2.onChange=exec;
number.onChange=exec;
exec();

};

Ops.Math.Compare.Between.prototype = new CABLES.Op();
CABLES.OPS["d629959e-838d-4541-b12f-15e2d6ff5131"]={f:Ops.Math.Compare.Between,objName:"Ops.Math.Compare.Between"};




// **************************************************************
// 
// Ops.Value.SwitchNumberOnTrigger
// 
// **************************************************************

Ops.Value.SwitchNumberOnTrigger = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var triggers=[];

var currentVal=op.outValue("Value");
var oldVal=op.outValue("Last Value");

var triggered=op.outTrigger("Triggered");

var inVals=[];
var inExes=[];

function onTrigger()
{
    oldVal.set(currentVal.get());
    currentVal.set( inVals[this.slot].get() );
    triggered.trigger();
}

var num=8;
for(var i=0;i<num;i++)
{
    var newExe=op.addInPort(new CABLES.Port(op,"Trigger "+i,CABLES.OP_PORT_TYPE_FUNCTION));
    newExe.slot=i;
    newExe.onTriggered=onTrigger.bind(newExe);
    var newVal=op.addInPort(new CABLES.Port(op,"Value "+i,CABLES.OP_PORT_TYPE_VALUE));
    inVals.push( newVal );
}

var defaultVal = op.inValueString("Default Value");

currentVal.set(defaultVal.get());
oldVal.set(defaultVal.get());

defaultVal.onChange = function(){
    oldVal.set(currentVal.get());
    currentVal.set(defaultVal.get());  
};





};

Ops.Value.SwitchNumberOnTrigger.prototype = new CABLES.Op();
CABLES.OPS["338032c5-bf47-454b-8ae1-cd91f17e5c5b"]={f:Ops.Value.SwitchNumberOnTrigger,objName:"Ops.Value.SwitchNumberOnTrigger"};




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


window.addEventListener('load', function(event) {
CABLES.jsLoaded=new Event('CABLES.jsLoaded');
document.dispatchEvent(CABLES.jsLoaded);
});
