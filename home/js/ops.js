"use strict";

var CABLES=CABLES||{};
CABLES.OPS=CABLES.OPS||{};

var Ops=Ops || {};
Ops.Gl=Ops.Gl || {};
Ops.Math=Ops.Math || {};
Ops.Html=Ops.Html || {};
Ops.Anim=Ops.Anim || {};
Ops.Value=Ops.Value || {};
Ops.Array=Ops.Array || {};
Ops.Points=Ops.Points || {};
Ops.Devices=Ops.Devices || {};
Ops.Gl.Meshes=Ops.Gl.Meshes || {};
Ops.Gl.Matrix=Ops.Gl.Matrix || {};
Ops.Gl.Shader=Ops.Gl.Shader || {};
Ops.Math.Compare=Ops.Math.Compare || {};
Ops.Devices.Mouse=Ops.Devices.Mouse || {};
Ops.Gl.ShaderEffects=Ops.Gl.ShaderEffects || {};
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
// Ops.Gl.Meshes.Torus
// 
// **************************************************************

Ops.Gl.Meshes.Torus = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    render=op.inTrigger('render'),
    sides=op.inValue("sides",32),
    rings=op.inValue("rings",32),
    innerRadius=op.inValue("innerRadius",0.5),
    outerRadius=op.inValue("outerRadius",1),
    indraw=op.inBool("Draw",true),
    trigger=op.outTrigger('trigger'),
    geomOut=op.outObject("geometry");

const UP=vec3.fromValues(0,1,0),RIGHT=vec3.fromValues(1,0,0);
var tmpNormal = vec3.create(), tmpVec = vec3.create();

geomOut.ignoreValueSerialize=true;

var cgl=op.patch.cgl;
var mesh=null;
var geom=null;
var j=0,i=0,idx=0;
var needsUpdate=true;

rings.onChange=
sides.onChange=
innerRadius.onChange=
outerRadius.onChange=function()
{
    needsUpdate=true;
};

render.onTriggered=function()
{
    if(needsUpdate) updateMesh();
    if(indraw.get() && mesh!==null) mesh.render(cgl.getShader());

    trigger.trigger();
};

function updateMesh()
{
    var nrings=Math.round(rings.get());
    var nsides=Math.round(sides.get());
    if(nrings<2)nrings=2;
    if(nsides<2)nsides=2;
    var r=innerRadius.get();
    var r2=outerRadius.get();
    generateTorus(r,r2, nrings, nsides);
    needsUpdate=false;
}

function circleTable(n,halfCircle)
{
    var i;
    /* Table size, the sign of n flips the circle direction */
    var size = Math.abs(n);

    /* Determine the angle between samples */
    var angle = (halfCircle?1:2)*Math.PI/n;// ( n === 0 ) ? 1 : n ;

    /* Allocate memory for n samples, plus duplicate of first entry at the end */
    var sint=[];
    var cost=[];

    /* Compute cos and sin around the circle */
    sint[0] = 0.0;
    cost[0] = 1.0;

    for (i=1; i<size; i++)
    {
        sint[i] = Math.sin(angle*i);
        cost[i] = Math.cos(angle*i);
    }

    if (halfCircle)
    {
        sint[size] =  0.0;  /* sin PI */
        cost[size] = -1.0;  /* cos PI */
    }
    else
    {
        /* Last sample is duplicate of the first (sin or cos of 2 PI) */
        sint[size] = sint[0];
        cost[size] = cost[0];
    }
    return {cost:cost,sint:sint};
}

function generateTorus(iradius,oradius,nRings,nSides)
{
    var table1=circleTable( nRings,false);
    var table2=circleTable(-nSides,false);
    var t;

    geom=new CGL.Geometry();
    geom.glPrimitive=cgl.gl.TRIANGLE_STRIP;
    geom.tangents = [];
    geom.biTangents = [];
    var tc=[];

    for( j=0; j<nRings; j++ )
    {
        for( i=0; i<nSides; i++ )
        {
            var offset = 3 * ( j * nSides + i ) ;
            var offset2 = 2 * ( j * nSides + i ) ;

            geom.vertices[offset  ] = table1.cost[j] * ( oradius + table2.cost[i] * iradius );
            geom.vertices[offset+1] = table1.sint[j] * ( oradius + table2.cost[i] * iradius );
            geom.vertices[offset+2] = table2.sint[i] * iradius;
            geom.vertexNormals[offset  ] = tmpNormal[0] = table1.cost[j] * table2.cost[i];
            geom.vertexNormals[offset+1] = tmpNormal[1] = table1.sint[j] * table2.cost[i];
            geom.vertexNormals[offset+2] = tmpNormal[2] = table2.sint[i];

            if (Math.abs(tmpNormal[1])==1) t = RIGHT;
            else t = UP;

            vec3.cross(tmpVec, tmpNormal, t);
            vec3.normalize(tmpVec,tmpVec);
            geom.tangents[offset  ] = tmpVec[0];
            geom.tangents[offset+1] = tmpVec[1];
            geom.tangents[offset+2] = tmpVec[2];
            vec3.cross(tmpVec, tmpVec, tmpNormal);
            geom.biTangents[offset  ] = tmpVec[0];
            geom.biTangents[offset+1] = tmpVec[1];
            geom.biTangents[offset+2] = tmpVec[2];

            tc[offset2] = j/(nRings-1);
            tc[offset2+1] = i/(nSides-1);
        }
    }

    for( i=0, idx=0; i<nSides; i++ )
    {
        var ioff = 1;
        if (i==nSides-1) ioff = -i;

        for( j=0; j<nRings; j++, idx+=2 )
        {
            var offset = j * nSides + i;
            geom.verticesIndices[idx  ] = offset;
            geom.verticesIndices[idx+1] = offset + ioff;

            tc[offset2] = j/(nRings+1);
            tc[offset2+1] = i/(nSides+1);
        }

        /* repeat first to close off shape */
        geom.verticesIndices[idx  ] = i;
        geom.verticesIndices[idx+1] = i + ioff;


        idx +=2;
    }

    geom.setTexCoords(tc);

    geomOut.set(null);
    geomOut.set(geom);

    if(!mesh)mesh=new CGL.Mesh(cgl,geom,cgl.gl.TRIANGLE_STRIP);
        else mesh.setGeom(geom);

}

};

Ops.Gl.Meshes.Torus.prototype = new CABLES.Op();
CABLES.OPS["d921e008-21b9-4cf5-84a2-4dedca34f0c8"]={f:Ops.Gl.Meshes.Torus,objName:"Ops.Gl.Meshes.Torus"};




// **************************************************************
// 
// Ops.Gl.Shader.MatCapMaterialNew_v2
// 
// **************************************************************

Ops.Gl.Shader.MatCapMaterialNew_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={matcap_frag:"\n{{MODULES_HEAD}}\n\nIN vec3 norm;\nIN vec2 texCoord;\nIN vec3 vNorm;\nUNI mat4 viewMatrix;\n\nUNI float opacity;\n\nUNI float r;\nUNI float g;\nUNI float b;\n\nIN vec3 e;\n\n\nUNI sampler2D texMatcap;\n\n#ifdef HAS_DIFFUSE_TEXTURE\n   UNI sampler2D texDiffuse;\n#endif\n\n#ifdef USE_SPECULAR_TEXTURE\n   UNI sampler2D texSpec;\n   UNI sampler2D texSpecMatCap;\n#endif\n\n#ifdef HAS_AO_TEXTURE\n    UNI sampler2D texAo;\n    UNI float aoIntensity;\n#endif\n\n#ifdef HAS_NORMAL_TEXTURE\n   IN vec3 vBiTangent;\n   IN vec3 vTangent;\n\n   UNI sampler2D texNormal;\n   UNI mat4 normalMatrix;\n\n   vec2 vNormt;\n#endif\n\n#ifdef HAS_TEXTURE_OPACITY\n    UNI sampler2D texOpacity;\n#endif\n\n#ifdef CALC_SSNORMALS\n    // from https://www.enkisoftware.com/devlogpost-20150131-1-Normal_generation_in_the_pixel_shader\n    IN vec3 eye_relative_pos;\n#endif\n\n\nconst float normalScale=0.4;\n\nconst vec2 invAtan = vec2(0.1591, 0.3183);\nvec2 sampleSphericalMap(vec3 direction)\n{\n    vec2 uv = vec2(atan(direction.z, direction.x), asin(direction.y));\n    uv *= invAtan;\n    uv += 0.5;\n    return uv;\n}\n\n\nvoid main()\n{\n    vec2 vnOrig=vNorm.xy;\n    vec2 vn=vNorm.xy;\n\n    #ifdef PER_PIXEL\n\n        vec3 ref = reflect( e, vNorm );\n        // ref=(ref);\n\n        // ref.z+=1.;\n        // ref=normalize(ref);\n\n        // float m = 2. * sqrt(\n        //     pow(ref.x, 2.0)+\n        //     pow(ref.y, 2.0)+\n        //     pow(ref.z+1., 2.0)\n        // );\n\n        float m = 2.58284271247461903 * sqrt( (length(ref)) );\n\n        vn.xy = ref.xy / m + 0.5;\n    #endif\n\n    #ifdef HAS_TEXTURES\n        vec2 texCoords=texCoord;\n        {{MODULE_BEGIN_FRAG}}\n    #endif\n\n    #ifdef CALC_SSNORMALS\n    \tvec3 dFdxPos = dFdx( eye_relative_pos );\n    \tvec3 dFdyPos = dFdy( eye_relative_pos );\n    \tvec3 ssn = normalize( cross(dFdxPos,dFdyPos ));\n\n        vec3 rr = reflect( e, ssn );\n        float ssm = 2. * sqrt(\n            pow(rr.x, 2.0)+\n            pow(rr.y, 2.0)+\n            pow(rr.z + 1.0, 2.0)\n        );\n\n\n        vn = (rr.xy / ssm + 0.5);\n\n        vn.t=clamp(vn.t, 0.0, 1.0);\n        vn.s=clamp(vn.s, 0.0, 1.0);\n\n        // float dst = dot(abs(coord-center), vec2(1.0));\n        // float aaf = fwidth(dst);\n        // float alpha = smoothstep(radius - aaf, radius, dst);\n\n    #endif\n\n   #ifdef HAS_NORMAL_TEXTURE\n        vec3 tnorm=texture( texNormal, texCoord ).xyz * 2.0 - 1.0;\n\n        tnorm = normalize(tnorm*normalScale);\n\n        vec3 tangent;\n        vec3 binormal;\n\n        #ifdef CALC_TANGENT\n            vec3 c1 = cross(norm, vec3(0.0, 0.0, 1.0));\n//            vec3 c2 = cross(norm, vec3(0.0, 1.0, 0.0));\n//            if(length(c1)>length(c2)) tangent = c2;\n//                else tangent = c1;\n            tangent = c1;\n            tangent = normalize(tangent);\n            binormal = cross(norm, tangent);\n            binormal = normalize(binormal);\n        #endif\n\n        #ifndef CALC_TANGENT\n            tangent=normalize(vTangent);\n//            tangent.y*=-13.0;\n//            binormal=vBiTangent*norm;\n//            binormal.z*=-1.0;\n//            binormal=normalize(binormal);\n            binormal=normalize( cross( normalize(norm), normalize(vBiTangent) ));\n        // vBinormal = normalize( cross( vNormal, vTangent ) * tangent.w );\n\n        #endif\n\n        tnorm=normalize(tangent*tnorm.x + binormal*tnorm.y + norm*tnorm.z);\n\n        // vec3 n = normalize( mat3(normalMatrix) * (norm+tnorm*normalScale) );\n        vec3 n = normalize( mat3(normalMatrix) * (norm+tnorm*normalScale) );\n\n        vec3 re = reflect( e, n );\n        float m = 2. * sqrt(\n            pow(re.x, 2.0)+\n            pow(re.y, 2.0)+\n            pow(re.z + 1.0, 2.0)\n        );\n\n        vn = (re.xy / m + 0.5);\n\n    #endif\n\n// vn=clamp(vn,0.0,1.0);\n\n\n\n\n\n    vec4 col = texture( texMatcap, vec2(vn.x,1.-vn.y) );\n\n    #ifdef HAS_DIFFUSE_TEXTURE\n        col = col*texture( texDiffuse, texCoords);\n    #endif\n\n    col.r*=r;\n    col.g*=g;\n    col.b*=b;\n\n\n    #ifdef HAS_AO_TEXTURE\n        col = col*\n            mix(\n                vec4(1.0,1.0,1.0,1.0),\n                texture( texAo, texCoords),\n                aoIntensity\n                );\n    #endif\n\n    #ifdef USE_SPECULAR_TEXTURE\n        vec4 spec = texture( texSpecMatCap, vn );\n        spec*= texture( texSpec, texCoords );\n        col+=spec;\n    #endif\n\n    col.a*=opacity;\n    #ifdef HAS_TEXTURE_OPACITY\n            #ifdef TRANSFORMALPHATEXCOORDS\n                texCoords=vec2(texCoord.s,1.0-texCoord.t);\n            #endif\n            #ifdef ALPHA_MASK_ALPHA\n                col.a*=texture(texOpacity,texCoords).a;\n            #endif\n            #ifdef ALPHA_MASK_LUMI\n                col.a*=dot(vec3(0.2126,0.7152,0.0722), texture(texOpacity,texCoords).rgb);\n            #endif\n            #ifdef ALPHA_MASK_R\n                col.a*=texture(texOpacity,texCoords).r;\n            #endif\n            #ifdef ALPHA_MASK_G\n                col.a*=texture(texOpacity,texCoords).g;\n            #endif\n            #ifdef ALPHA_MASK_B\n                col.a*=texture(texOpacity,texCoords).b;\n            #endif\n            // #endif\n    #endif\n\n    {{MODULE_COLOR}}\n\n\n    // #ifdef PER_PIXEL\n\n\n    //     vec2 nn=(vn-0.5)*2.0;\n    //     float ll=length( nn );\n    //     // col.r=0.0;\n    //     // col.b=0.0;\n    //     // col.a=1.0;\n\n    //     // if(ll>0.49 && ll<0.51) col=vec4(0.0,1.0,0.0,1.0);\n    //     // if(ll>0. ) col=vec4(0.0,1.0,0.0,1.0);\n    //     // col=vec4(vn,0.0,1.0);\n\n\n    //     float dd=(vn.x-0.5)*(vn.x-0.5) + (vn.y-0.5)*(vn.y-0.5);\n    //     dd*=4.0;\n\n    //     if(dd>0.94)\n    //     {\n    //     col=vec4(0.0,1.0,0.0,1.0);\n    //         // nn*=0.5;\n    //         // nn+=0.5;\n    //         // nn*=2.0;\n    //         // vn=nn;\n\n    //         // // dd=1.0;\n    //     }\n    //     // else dd=0.0;\n\n    //     // col=vec4(vec3(dd),1.0);\n\n    //     // if(dd>0.95) col=vec4(1.0,0.0,0.0,1.0);\n\n    //     // vec2 test=(vec2(1.0,1.0)-0.5)*2.0;\n    //     // col=vec4(0.0,0.0,length(test),1.0);\n\n    // #endif\n\n\n\n    outColor = col;\n\n}",matcap_vert:"\nIN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN vec3 attrVertNormal;\nIN float attrVertIndex;\nIN vec3 attrTangent;\nIN vec3 attrBiTangent;\n\n#ifdef HAS_NORMAL_TEXTURE\n\n   OUT vec3 vBiTangent;\n   OUT vec3 vTangent;\n#endif\n\nOUT vec2 texCoord;\nOUT vec3 norm;\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\n\nOUT vec3 vNorm;\nOUT vec3 e;\n\nUNI vec2 texOffset;\nUNI vec2 texRepeat;\n\n\n#ifndef INSTANCING\n    UNI mat4 normalMatrix;\n#endif\n\n\n{{MODULES_HEAD}}\n\n#ifdef CALC_SSNORMALS\n    // from https://www.enkisoftware.com/devlogpost-20150131-1-Normal_generation_in_the_pixel_shader\n    OUT vec3 eye_relative_pos;\n#endif\n\nUNI vec3 camPos;\n\n\n// mat3 transposeMat3(mat3 m)\n// {\n//     return mat3(m[0][0], m[1][0], m[2][0],\n//         m[0][1], m[1][1], m[2][1],\n//         m[0][2], m[1][2], m[2][2]);\n// }\n\n// mat3 inverseMat3(mat3 m)\n// {\n//     float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2];\n//     float a10 = m[1][0], a11 = m[1][1], a12 = m[1][2];\n//     float a20 = m[2][0], a21 = m[2][1], a22 = m[2][2];\n\n//     float b01 = a22 * a11 - a12 * a21;\n//     float b11 = -a22 * a10 + a12 * a20;\n//     float b21 = a21 * a10 - a11 * a20;\n\n//     float det = a00 * b01 + a01 * b11 + a02 * b21;\n\n//     return mat3(b01, (-a22 * a01 + a02 * a21), (a12 * a01 - a02 * a11),\n//         b11, (a22 * a00 - a02 * a20), (-a12 * a00 + a02 * a10),\n//         b21, (-a21 * a00 + a01 * a20), (a11 * a00 - a01 * a10)) / det;\n// }\n\nvoid main()\n{\n    texCoord=texRepeat*vec2(attrTexCoord.x,attrTexCoord.y)+texOffset;\n\n\n    norm=attrVertNormal;\n    mat4 mMatrix=modelMatrix;\n    mat4 mvMatrix;\n    vec3 tangent=attrTangent;\n    vec3 bitangent=attrBiTangent;\n\n    #ifdef HAS_NORMAL_TEXTURE\n        vTangent=attrTangent;\n        vBiTangent=attrBiTangent;\n    #endif\n\n    vec4 pos = vec4( vPosition, 1. );\n\n    {{MODULE_VERTEX_POSITION}}\n\n\n    mvMatrix= viewMatrix * mMatrix;\n\n    #ifdef INSTANCING\n        mat4 normalMatrix=mvMatrix;//inverse(transpose(mvMatrix));\n        // mat4 normalMatrix = mat4(transposeMat3(inverseMat3(mat3(mMatrix))));\n\n    #endif\n\n\n    mat3 wmMatrix=mat3(mMatrix);\n\n    e = normalize( vec3( mvMatrix * pos )  );\n    vec3 n = normalize( mat3(normalMatrix*viewMatrix) * (norm) );\n\n    #ifdef PER_PIXEL\n        vNorm=n;\n    #endif\n    #ifndef PER_PIXEL\n        //matcap\n        vec3 r = reflect( e, n );\n\n        // float m = 2. * sqrt(\n        //     pow(r.x, 2.0)+\n        //     pow(r.y, 2.0)+\n        //     pow(r.z + 1.0, 2.0)\n        // );\n\n        float m = 2.58284271247461903 * sqrt(length(r));\n\n        vNorm.xy = r.xy / m + 0.5;\n\n    #endif\n\n\n\n    #ifdef DO_PROJECT_COORDS_XY\n       texCoord=(projMatrix * mvMatrix*pos).xy*0.1;\n    #endif\n\n    #ifdef DO_PROJECT_COORDS_YZ\n       texCoord=(projMatrix * mvMatrix*pos).yz*0.1;\n    #endif\n\n    #ifdef DO_PROJECT_COORDS_XZ\n        texCoord=(projMatrix * mvMatrix*pos).xz*0.1;\n    #endif\n\n    #ifdef CALC_SSNORMALS\n        eye_relative_pos = (mvMatrix * pos ).xyz - camPos;\n    #endif\n\n\n\n   gl_Position = projMatrix * mvMatrix * pos;\n\n}",};
const
    render=op.inTrigger("render"),
    textureMatcap=op.inTexture('MatCap'),
    textureDiffuse=op.inTexture('Diffuse'),
    textureNormal=op.inTexture('Normal'),
    textureSpec=op.inTexture('Specular'),
    textureSpecMatCap=op.inTexture('Specular MatCap'),
    textureAo=op.inTexture('AO Texture'),
    textureOpacity=op.inTexture("Opacity Texture"),
    r=op.inValueSlider('r',1),
    g=op.inValueSlider('g',1),
    b=op.inValueSlider('b',1),
    pOpacity=op.inValueSlider("Opacity",1),
    aoIntensity=op.inValueSlider("AO Intensity",1.0),
    repeatX=op.inValue("Repeat X",1),
    repeatY=op.inValue("Repeat Y",1),
    offsetX=op.inValue("Offset X",0),
    offsetY=op.inValue("Offset Y",0),
    calcTangents = op.inValueBool("calc normal tangents",true),
    projectCoords=op.inValueSelect('projectCoords',['no','xy','yz','xz'],'no'),
    ssNormals=op.inValueBool("Screen Space Normals"),
    next=op.outTrigger("trigger"),
    shaderOut=op.outObject("Shader");

r.setUiAttribs({colorPick:true});

const alphaMaskSource=op.inSwitch("Alpha Mask Source",["Luminance","R","G","B","A"],"Luminance");
alphaMaskSource.setUiAttribs({ greyout:true });

const texCoordAlpha=op.inValueBool("Opacity TexCoords Transform",false);
const discardTransPxl=op.inValueBool("Discard Transparent Pixels");

op.setPortGroup("Texture Opacity",[alphaMaskSource, texCoordAlpha, discardTransPxl]);
op.setPortGroup("Texture maps",[textureDiffuse,textureNormal,textureSpec,textureSpecMatCap,textureAo, textureOpacity]);
op.setPortGroup("Color",[r,g,b,pOpacity]);

const cgl=op.patch.cgl;
const shader=new CGL.Shader(cgl,'MatCapMaterialNew');
var uniOpacity=new CGL.Uniform(shader,'f','opacity',pOpacity);

shader.setModules(['MODULE_VERTEX_POSITION','MODULE_COLOR','MODULE_BEGIN_FRAG']);
shader.setSource(attachments.matcap_vert,attachments.matcap_frag);
shaderOut.set(shader);

var textureMatcapUniform=new CGL.Uniform(shader,'t','texMatcap',0);
var textureDiffuseUniform=null;
var textureNormalUniform=null;
var textureSpecUniform=null;
var textureSpecMatCapUniform=null;
var textureAoUniform=null;
const offsetUniform=new CGL.Uniform(shader,'2f','texOffset',offsetX,offsetY);
const repeatUniform=new CGL.Uniform(shader,'2f','texRepeat',repeatX,repeatY);

var aoIntensityUniform=new CGL.Uniform(shader,'f','aoIntensity',aoIntensity);
b.uniform=new CGL.Uniform(shader,'f','b',b);
g.uniform=new CGL.Uniform(shader,'f','g',g);
r.uniform=new CGL.Uniform(shader,'f','r',r);


calcTangents.onChange=updateDefines;
updateDefines();

function updateDefines()
{
    if(calcTangents.get()) shader.define('CALC_TANGENT');
    else shader.removeDefine('CALC_TANGENT');
}

ssNormals.onChange=function()
{
    if(ssNormals.get())
    {
        if(cgl.glVersion<2)
        {
            cgl.gl.getExtension('OES_standard_derivatives');
            shader.enableExtension('GL_OES_standard_derivatives');
        }

        shader.define('CALC_SSNORMALS');
    }
    else shader.removeDefine('CALC_SSNORMALS');
};

projectCoords.onChange=function()
{
    shader.toggleDefine('DO_PROJECT_COORDS_XY',projectCoords.get()=='xy');
    shader.toggleDefine('DO_PROJECT_COORDS_YZ',projectCoords.get()=='yz');
    shader.toggleDefine('DO_PROJECT_COORDS_XZ',projectCoords.get()=='xz');
};

textureMatcap.onChange=updateMatcap;

function updateMatcap()
{
    if(!cgl.defaultMatcapTex)
    {
        var pixels=new Uint8Array(256*4);
        for(var x=0;x<16;x++)
        {
            for(var y=0;y<16;y++)
            {
                var c=y*16;
                c*=Math.min(1,(x+y/3)/8);
                pixels[(x+y*16)*4+0]=pixels[(x+y*16)*4+1]=pixels[(x+y*16)*4+2]=c;
                pixels[(x+y*16)*4+3]=255;
            }
        }

        cgl.defaultMatcapTex=new CGL.Texture(cgl);
        cgl.defaultMatcapTex.initFromData(pixels,16,16,CGL.Texture.FILTER_LINEAR, CGL.Texture.WRAP_REPEAT);
    }

    // if(textureMatcap.get())
    // {
    //     if(textureMatcapUniform!==null)return;
    //     shader.removeUniform('texMatcap');
    // }
    // else
    // {
    //     // textureMatcap.set(cgl.defaultMatcapTex);

    //     shader.removeUniform('texMatcap');
    //     textureMatcapUniform=new CGL.Uniform(shader,'t','texMatcap',0);
    // }


}

textureDiffuse.onChange=function()
{
    if(textureDiffuse.get())
    {
        if(textureDiffuseUniform!==null)return;
        shader.define('HAS_DIFFUSE_TEXTURE');
        shader.removeUniform('texDiffuse');
        textureDiffuseUniform=new CGL.Uniform(shader,'t','texDiffuse',1);
    }
    else
    {
        shader.removeDefine('HAS_DIFFUSE_TEXTURE');
        shader.removeUniform('texDiffuse');
        textureDiffuseUniform=null;
    }
};

textureNormal.onChange=function()
{
    if(textureNormal.get())
    {
        if(textureNormalUniform!==null)return;
        shader.define('HAS_NORMAL_TEXTURE');
        shader.removeUniform('texNormal');
        textureNormalUniform=new CGL.Uniform(shader,'t','texNormal',2);
    }
    else
    {
        shader.removeDefine('HAS_NORMAL_TEXTURE');
        shader.removeUniform('texNormal');
        textureNormalUniform=null;
    }
};

textureAo.onChange=function()
{
    if(textureAo.get())
    {
        if(textureAoUniform!==null)return;
        shader.define('HAS_AO_TEXTURE');
        shader.removeUniform('texAo');
        textureAoUniform=new CGL.Uniform(shader,'t','texAo',5);
    }
    else
    {
        shader.removeDefine('HAS_AO_TEXTURE');
        shader.removeUniform('texAo');
        textureAoUniform=null;
    }
};

textureSpec.onChange=textureSpecMatCap.onChange=function()
{
    if(textureSpec.get() && textureSpecMatCap.get())
    {
        if(textureSpecUniform!==null)return;
        shader.define('USE_SPECULAR_TEXTURE');
        shader.removeUniform('texSpec');
        shader.removeUniform('texSpecMatCap');
        textureSpecUniform=new CGL.Uniform(shader,'t','texSpec',3);
        textureSpecMatCapUniform=new CGL.Uniform(shader,'t','texSpecMatCap',4);
    }
    else
    {
        shader.removeDefine('USE_SPECULAR_TEXTURE');
        shader.removeUniform('texSpec');
        shader.removeUniform('texSpecMatCap');
        textureSpecUniform=null;
        textureSpecMatCapUniform=null;
    }
};

// TEX OPACITY

function updateAlphaMaskMethod()
{
    if(alphaMaskSource.get()=='Alpha Channel') shader.define('ALPHA_MASK_ALPHA');
    else shader.removeDefine('ALPHA_MASK_ALPHA');

    if(alphaMaskSource.get()=='Luminance') shader.define('ALPHA_MASK_LUMI');
    else shader.removeDefine('ALPHA_MASK_LUMI');

    if(alphaMaskSource.get()=='R') shader.define('ALPHA_MASK_R');
    else shader.removeDefine('ALPHA_MASK_R');

    if(alphaMaskSource.get()=='G') shader.define('ALPHA_MASK_G');
    else shader.removeDefine('ALPHA_MASK_G');

    if(alphaMaskSource.get()=='B') shader.define('ALPHA_MASK_B');
    else shader.removeDefine('ALPHA_MASK_B');
}
alphaMaskSource.onChange=updateAlphaMaskMethod;
textureOpacity.onChange=updateOpacity;

var textureOpacityUniform = null;

function updateOpacity()
{

    if(textureOpacity.get())
    {
        if(textureOpacityUniform!==null)return;
        shader.removeUniform('texOpacity');
        shader.define('HAS_TEXTURE_OPACITY');
        if(!textureOpacityUniform) textureOpacityUniform=new CGL.Uniform(shader,'t','texOpacity',6);

        alphaMaskSource.setUiAttribs({greyout:false});
        discardTransPxl.setUiAttribs({greyout:false});
        texCoordAlpha.setUiAttribs({greyout:false});

    }
    else
    {
        shader.removeUniform('texOpacity');
        shader.removeDefine('HAS_TEXTURE_OPACITY');
        textureOpacityUniform=null;

        alphaMaskSource.setUiAttribs({greyout:true});
        discardTransPxl.setUiAttribs({greyout:true});
        texCoordAlpha.setUiAttribs({greyout:true});
    }
    updateAlphaMaskMethod();
};

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

op.onDelete=function()
{
    // if(cgl.defaultMatcapTex)
    // {
    //     cgl.defaultMatcapTex.delete();
    //     cgl.defaultMatcapTex=null;
    // }
};

op.preRender=function()
{
    shader.bind();
};

render.onTriggered=function()
{
    if(!cgl.defaultMatcapTex) updateMatcap();
    shader.popTextures();


    const tex=textureMatcap.get() || cgl.defaultMatcapTex;
    shader.pushTexture(textureMatcapUniform,tex.tex);

    if(textureDiffuse.get() && textureDiffuseUniform) shader.pushTexture(textureDiffuseUniform,textureDiffuse.get().tex);
    if(textureNormal.get() && textureNormalUniform) shader.pushTexture(textureNormalUniform,textureNormal.get().tex);
    if(textureSpec.get() && textureSpecUniform) shader.pushTexture(textureSpecUniform,textureSpec.get().tex);
    if(textureSpecMatCap.get() && textureSpecMatCapUniform) shader.pushTexture(textureSpecMatCapUniform,textureSpecMatCap.get().tex);
    if(textureAo.get() && textureAoUniform)  der.pushTexture(textureAoUniform,textureAo.get().tex);
    if(textureOpacity.get() && textureOpacityUniform) shader.pushTexture(textureOpacityUniform, textureOpacity.get().tex);


    cgl.pushShader(shader);
    next.trigger();
    cgl.popShader();
};



};

Ops.Gl.Shader.MatCapMaterialNew_v2.prototype = new CABLES.Op();
CABLES.OPS["264b5f8d-82dd-44c6-ae03-741a702e904a"]={f:Ops.Gl.Shader.MatCapMaterialNew_v2,objName:"Ops.Gl.Shader.MatCapMaterialNew_v2"};




// **************************************************************
// 
// Ops.Gl.ShaderEffects.PerlinAreaDeform_v3
// 
// **************************************************************

Ops.Gl.ShaderEffects.PerlinAreaDeform_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={perlindeform_vert:"\nUNI bool MOD_smooth;\nUNI float MOD_x,MOD_y,MOD_z;\nUNI float MOD_strength;\nUNI float MOD_size;\nUNI float MOD_scale;\nUNI float MOD_mScale;\nUNI float MOD_scrollx;\nUNI float MOD_scrolly;\nUNI float MOD_scrollz;\nUNI float MOD_fallOff;\n\nvec3 MOD_newTangent,MOD_newBiTangent;\n\n\n\n#ifndef PERLINDEFORM\n#define PERLINDEFORM\nfloat Interpolation_C2( float x ) { return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }   //  6x^5-15x^4+10x^3\t( Quintic Curve.  As used by Perlin in Improved Noise.  http://mrl.nyu.edu/~perlin/paper445.pdf )\nvec2 Interpolation_C2( vec2 x ) { return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }\nvec3 Interpolation_C2( vec3 x ) { return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }\nvec4 Interpolation_C2( vec4 x ) { return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }\nvec4 Interpolation_C2_InterpAndDeriv( vec2 x ) { return x.xyxy * x.xyxy * ( x.xyxy * ( x.xyxy * ( x.xyxy * vec2( 6.0, 0.0 ).xxyy + vec2( -15.0, 30.0 ).xxyy ) + vec2( 10.0, -60.0 ).xxyy ) + vec2( 0.0, 30.0 ).xxyy ); }\nvec3 Interpolation_C2_Deriv( vec3 x ) { return x * x * (x * (x * 30.0 - 60.0) + 30.0); }\n\n\nvoid FAST32_hash_3D( \tvec3 gridcell,\n                        out vec4 lowz_hash_0,\n                        out vec4 lowz_hash_1,\n                        out vec4 lowz_hash_2,\n                        out vec4 highz_hash_0,\n                        out vec4 highz_hash_1,\n                        out vec4 highz_hash_2\t)\t\t//\tgenerates 3 random numbers for each of the 8 cell corners\n{\n    //    gridcell is assumed to be an integer coordinate\n\n    //\tTODO: \tthese constants need tweaked to find the best possible noise.\n    //\t\t\tprobably requires some kind of brute force computational searching or something....\n    const vec2 OFFSET = vec2( 50.0, 161.0 );\n    const float DOMAIN = 69.0;\n    const vec3 SOMELARGEFLOATS = vec3( 635.298681, 682.357502, 668.926525 );\n    const vec3 ZINC = vec3( 48.500388, 65.294118, 63.934599 );\n\n    //\ttruncate the domain\n    gridcell.xyz = gridcell.xyz - floor(gridcell.xyz * ( 1.0 / DOMAIN )) * DOMAIN;\n    vec3 gridcell_inc1 = step( gridcell, vec3( DOMAIN - 1.5 ) ) * ( gridcell + 1.0 );\n\n    //\tcalculate the noise\n    vec4 P = vec4( gridcell.xy, gridcell_inc1.xy ) + OFFSET.xyxy;\n    P *= P;\n    P = P.xzxz * P.yyww;\n    vec3 lowz_mod = vec3( 1.0 / ( SOMELARGEFLOATS.xyz + gridcell.zzz * ZINC.xyz ) );\n    vec3 highz_mod = vec3( 1.0 / ( SOMELARGEFLOATS.xyz + gridcell_inc1.zzz * ZINC.xyz ) );\n    lowz_hash_0 = fract( P * lowz_mod.xxxx );\n    highz_hash_0 = fract( P * highz_mod.xxxx );\n    lowz_hash_1 = fract( P * lowz_mod.yyyy );\n    highz_hash_1 = fract( P * highz_mod.yyyy );\n    lowz_hash_2 = fract( P * lowz_mod.zzzz );\n    highz_hash_2 = fract( P * highz_mod.zzzz );\n}\n\n//\n//\tPerlin Noise 3D  ( gradient noise )\n//\tReturn value range of -1.0->1.0\n//\thttp://briansharpe.files.wordpress.com/2011/11/perlinsample.jpg\n//\nfloat Perlin3D( vec3 P )\n{\n    //\testablish our grid cell and unit position\n    vec3 Pi = floor(P);\n    vec3 Pf = P - Pi;\n    vec3 Pf_min1 = Pf - 1.0;\n\n#if 1\n    //\n    //\tclassic noise.\n    //\trequires 3 random values per point.  with an efficent hash function will run faster than improved noise\n    //\n\n    //\tcalculate the hash.\n    //\t( various hashing methods listed in order of speed )\n    vec4 hashx0, hashy0, hashz0, hashx1, hashy1, hashz1;\n    FAST32_hash_3D( Pi, hashx0, hashy0, hashz0, hashx1, hashy1, hashz1 );\n    //SGPP_hash_3D( Pi, hashx0, hashy0, hashz0, hashx1, hashy1, hashz1 );\n\n    //\tcalculate the gradients\n    vec4 grad_x0 = hashx0 - 0.49999;\n    vec4 grad_y0 = hashy0 - 0.49999;\n    vec4 grad_z0 = hashz0 - 0.49999;\n    vec4 grad_x1 = hashx1 - 0.49999;\n    vec4 grad_y1 = hashy1 - 0.49999;\n    vec4 grad_z1 = hashz1 - 0.49999;\n    vec4 grad_results_0 = inversesqrt( grad_x0 * grad_x0 + grad_y0 * grad_y0 + grad_z0 * grad_z0 ) * ( vec2( Pf.x, Pf_min1.x ).xyxy * grad_x0 + vec2( Pf.y, Pf_min1.y ).xxyy * grad_y0 + Pf.zzzz * grad_z0 );\n    vec4 grad_results_1 = inversesqrt( grad_x1 * grad_x1 + grad_y1 * grad_y1 + grad_z1 * grad_z1 ) * ( vec2( Pf.x, Pf_min1.x ).xyxy * grad_x1 + vec2( Pf.y, Pf_min1.y ).xxyy * grad_y1 + Pf_min1.zzzz * grad_z1 );\n\n#if 1\n    //\tClassic Perlin Interpolation\n    vec3 blend = Interpolation_C2( Pf );\n    vec4 res0 = mix( grad_results_0, grad_results_1, blend.z );\n    vec4 blend2 = vec4( blend.xy, vec2( 1.0 - blend.xy ) );\n    float final = dot( res0, blend2.zxzx * blend2.wwyy );\n    final *= 1.1547005383792515290182975610039;\t\t//\t(optionally) scale things to a strict -1.0->1.0 range    *= 1.0/sqrt(0.75)\n    return final;\n#else\n    //\tClassic Perlin Surflet\n    //\thttp://briansharpe.wordpress.com/2012/03/09/modifications-to-classic-perlin-noise/\n    Pf *= Pf;\n    Pf_min1 *= Pf_min1;\n    vec4 vecs_len_sq = vec4( Pf.x, Pf_min1.x, Pf.x, Pf_min1.x ) + vec4( Pf.yy, Pf_min1.yy );\n    float final = dot( Falloff_Xsq_C2( min( vec4( 1.0 ), vecs_len_sq + Pf.zzzz ) ), grad_results_0 ) + dot( Falloff_Xsq_C2( min( vec4( 1.0 ), vecs_len_sq + Pf_min1.zzzz ) ), grad_results_1 );\n    final *= 2.3703703703703703703703703703704;\t\t//\t(optionally) scale things to a strict -1.0->1.0 range    *= 1.0/cube(0.75)\n    return final;\n#endif\n\n#else\n    //\n    //\timproved noise.\n    //\trequires 1 random value per point.  Will run faster than classic noise if a slow hashing function is used\n    //\n\n    //\tcalculate the hash.\n    //\t( various hashing methods listed in order of speed )\n    vec4 hash_lowz, hash_highz;\n    FAST32_hash_3D( Pi, hash_lowz, hash_highz );\n    //BBS_hash_3D( Pi, hash_lowz, hash_highz );\n    //SGPP_hash_3D( Pi, hash_lowz, hash_highz );\n\n    //\n    //\t\"improved\" noise using 8 corner gradients.  Faster than the 12 mid-edge point method.\n    //\tKen mentions using diagonals like this can cause \"clumping\", but we'll live with that.\n    //\t[1,1,1]  [-1,1,1]  [1,-1,1]  [-1,-1,1]\n    //\t[1,1,-1] [-1,1,-1] [1,-1,-1] [-1,-1,-1]\n    //\n    hash_lowz -= 0.5;\n    vec4 grad_results_0_0 = vec2( Pf.x, Pf_min1.x ).xyxy * sign( hash_lowz );\n    hash_lowz = abs( hash_lowz ) - 0.25;\n    vec4 grad_results_0_1 = vec2( Pf.y, Pf_min1.y ).xxyy * sign( hash_lowz );\n    vec4 grad_results_0_2 = Pf.zzzz * sign( abs( hash_lowz ) - 0.125 );\n    vec4 grad_results_0 = grad_results_0_0 + grad_results_0_1 + grad_results_0_2;\n\n    hash_highz -= 0.5;\n    vec4 grad_results_1_0 = vec2( Pf.x, Pf_min1.x ).xyxy * sign( hash_highz );\n    hash_highz = abs( hash_highz ) - 0.25;\n    vec4 grad_results_1_1 = vec2( Pf.y, Pf_min1.y ).xxyy * sign( hash_highz );\n    vec4 grad_results_1_2 = Pf_min1.zzzz * sign( abs( hash_highz ) - 0.125 );\n    vec4 grad_results_1 = grad_results_1_0 + grad_results_1_1 + grad_results_1_2;\n\n    //\tblend the gradients and return\n    vec3 blend = Interpolation_C2( Pf );\n    vec4 res0 = mix( grad_results_0, grad_results_1, blend.z );\n    vec4 blend2 = vec4( blend.xy, vec2( 1.0 - blend.xy ) );\n    return dot( res0, blend2.zxzx * blend2.wwyy ) * (2.0 / 3.0);\t//\t(optionally) mult by (2.0/3.0) to scale to a strict -1.0->1.0 range\n#endif\n}\n\n#endif\n\nvec3 MOD_deform(vec3 pos,vec3 norm)\n{\n    vec3 modelPos=pos;\n    vec3 forcePos=vec3(MOD_x,MOD_y,MOD_z);\n\n    vec3 vecToOrigin=modelPos-forcePos;\n    float dist=abs(length(vecToOrigin));\n    // float distAlpha = (MOD_size - dist) / MOD_size;\n\n    if(dist*MOD_mScale<MOD_size*MOD_mScale)\n    {\n        vec3 ppos=vec3(pos*MOD_scale*MOD_mScale);\n        ppos.x+=MOD_scrollx;\n        ppos.y+=MOD_scrolly;\n        ppos.z+=MOD_scrollz;\n\n        float p=(Perlin3D(ppos))*MOD_strength;\n\n        float dist=distance(vec3(MOD_x,MOD_y,MOD_z),modelPos);\n        float fallOff=1.0-smoothstep(MOD_fallOff*MOD_size,MOD_size,dist);\n\n        vec3 pnorm=norm;//normalize(pos.xyz);\n\n        #ifdef MOD_METH_MULNORM\n            pos.x+=p*pnorm.x*fallOff;\n            pos.y+=p*pnorm.y*fallOff;\n            pos.z+=p*pnorm.z*fallOff;\n        #endif\n\n        #ifdef MOD_METH_ADD_XYZ\n            pos.x+=p*fallOff;\n            pos.y+=p*fallOff;\n            pos.z+=p*fallOff;\n        #endif\n\n        #ifdef MOD_METH_ADD_Z\n            pos.z+=p*fallOff;\n        #endif\n    }\n\n    return pos;\n}\n\n// LOOK AT THIS./....\n//https://github.com/spite/perlin-experiments/blob/master/chrome.html\n\n\nvec3 MOD_calcNormal(vec3 pos,vec3 norm,vec3 tangent,vec3 bitangent)\n{\n    //http://diary.conewars.com/vertex-displacement-shader/\n    vec4 position=vec4(MOD_deform(pos,norm),1.0);\n\n    vec3 positionAndTangent = MOD_deform( pos + tangent * 0.1,norm );\n    vec3 positionAndBitangent = MOD_deform( pos + bitangent * 0.1,norm );\n\n    MOD_newTangent = ( positionAndTangent - position.xyz ); // leaves just 'tangent'\n    MOD_newBiTangent = ( positionAndBitangent - position.xyz ); // leaves just 'bitangent'\n\n    vec3 newNormal = cross( MOD_newTangent.xyz, MOD_newBiTangent.xyz );\n    return normalize(newNormal.xyz);\n\n}\n\n",perlindeform_body_vert:"\n#ifndef MOD_WORLDSPACE\n    pos.xyz=MOD_deform(pos.xyz,norm.xyz);\n\n    #ifdef MOD_CALC_NORMALS\n        norm=MOD_calcNormal(pos.xyz,norm.xyz,tangent,bitangent);\n    #endif\n#endif\n\n#ifdef MOD_WORLDSPACE\n    pos.xyz=MOD_deform( (mMatrix*pos).xyz ,norm.xyz);\n\n    #ifdef MOD_CALC_NORMALS\n        norm=MOD_calcNormal( (mMatrix*pos).xyz,norm.xyz,tangent,bitangent);\n    #endif\n#endif\n\n#ifdef MOD_CALC_NORMALS\n    tangent=MOD_newTangent;\n    bitangent=MOD_newBiTangent;\n#endif",};
const
    render=op.inTrigger("render"),
    next=op.outTrigger("trigger"),
    inScale=op.inValueFloat("Scale",1),
    inSize=op.inValueFloat("Size",1),
    inStrength=op.inValueFloat("Strength",1),
    inCalcNormals=op.inValueBool("Calc Normals",true),
    inFalloff=op.inValueSlider("Falloff",0.5),
    output=op.inValueSelect("Output",['Mul Normal','Add XYZ','Add Z'],'Add XYZ'),
    x=op.inValueFloat("x"),
    y=op.inValueFloat("y"),
    z=op.inValueFloat("z"),
    scrollx=op.inValueFloat("Scroll X"),
    scrolly=op.inValueFloat("Scroll Y"),
    scrollz=op.inValueFloat("Scroll Z");

const cgl=op.patch.cgl;
inCalcNormals.onChange=updateCalcNormals;
var inWorldSpace=op.inValueBool("WorldSpace");
var shader=null;
var moduleVert=null;
output.onChange=updateOutput;
render.onLinkChanged=removeModule;

var mscaleUni=null;
inWorldSpace.onChange=updateWorldspace;

function updateCalcNormals()
{
    if(!shader)return;
    shader.toggleDefine(moduleVert.prefix+"CALC_NORMALS",inCalcNormals.get());
}

function removeModule()
{
    if(shader && moduleVert) shader.removeModule(moduleVert);
    shader=null;
}

function updateOutput()
{
    if(!shader)return;

    shader.toggleDefine(moduleVert.prefix+"METH_ADD_XYZ",output.get()=='Add XYZ');
    shader.toggleDefine(moduleVert.prefix+"METH_ADD_Z",output.get()=='Add Z');
    shader.toggleDefine(moduleVert.prefix+"METH_MULNORM",output.get()=='Mul Normal');
}

function updateWorldspace()
{
    if(!shader)return;
    if(inWorldSpace.get()) shader.define(moduleVert.prefix+"WORLDSPACE");
        else shader.removeDefine(moduleVert.prefix+"WORLDSPACE");
}

function getScaling(mat)
{
    var m31 = mat[8];
    var m32 = mat[9];
    var m33 = mat[10];
    return Math.hypot(m31, m32, m33);
}

render.onTriggered=function()
{
    if(!cgl.getShader())
    {
        next.trigger();
        return;
    }

    var modelScale=getScaling(cgl.mMatrix);
    if(mscaleUni)mscaleUni.setValue(modelScale);

    if(CABLES.UI)
    {
        cgl.pushModelMatrix();

        if(CABLES.UI && (op.isCurrentUiOp() ||  CABLES.UI.renderHelper))
        {
            cgl.pushModelMatrix();
            mat4.translate(cgl.mMatrix,cgl.mMatrix,[x.get(),y.get(),z.get()]);
            CABLES.GL_MARKER.drawSphere(op,inSize.get());
            cgl.popModelMatrix();
        }

        if(op.isCurrentUiOp())
            gui.setTransformGizmo(
                {
                    posX:x,
                    posY:y,
                    posZ:z
                });

        cgl.popModelMatrix();
    }

    if(cgl.getShader()!=shader)
    {
        if(shader) removeModule();
        shader=cgl.getShader();

        moduleVert=shader.addModule(
            {
                title:op.objName,
                name:'MODULE_VERTEX_POSITION',
                srcHeadVert:attachments.perlindeform_vert,
                srcBodyVert:attachments.perlindeform_body_vert
            });

        inSize.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'size',inSize);
        inStrength.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'strength',inStrength);
        inScale.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'scale',inScale);

        scrollx.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'scrollx',scrollx);
        scrolly.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'scrolly',scrolly);
        scrollz.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'scrollz',scrollz);

        x.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'x',x);
        y.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'y',y);
        z.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'z',z);
        inFalloff.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'fallOff',inFalloff);

        mscaleUni=new CGL.Uniform(shader,'f',moduleVert.prefix+'mScale',1);

        updateOutput();
        updateWorldspace();
        updateCalcNormals();
    }

    if(!shader)return;

    next.trigger();
};















};

Ops.Gl.ShaderEffects.PerlinAreaDeform_v3.prototype = new CABLES.Op();
CABLES.OPS["e4432ebd-d67c-46e2-b302-619d4f97daab"]={f:Ops.Gl.ShaderEffects.PerlinAreaDeform_v3,objName:"Ops.Gl.ShaderEffects.PerlinAreaDeform_v3"};




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
// Ops.Gl.TextureEffects.ChromaticAberration
// 
// **************************************************************

Ops.Gl.TextureEffects.ChromaticAberration = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={chromatic_frag:"\nIN vec2 texCoord;\nUNI sampler2D tex;\nUNI float pixel;\nUNI float onePixel;\nUNI float amount;\nUNI float lensDistort;\n\n#ifdef MASK\nUNI sampler2D texMask;\n#endif\n\n{{CGL.BLENDMODES}}\n\nvoid main()\n{\n   vec4 base=texture(tex,texCoord);\n   vec4 col=texture(tex,texCoord);\n\n   vec2 tc=texCoord;;\n   float pix = pixel;\n   if(lensDistort>0.0)\n   {\n       float dist = distance(texCoord, vec2(0.5,0.5));\n       tc-=0.5;\n       tc *=smoothstep(-0.9,1.0*lensDistort,1.0-dist);\n       tc+=0.5;\n   }\n\n    #ifdef MASK\n        vec4 m=texture(texMask,texCoord);\n        pix*=m.r*m.a;\n    #endif\n\n    #ifdef SMOOTH\n    #ifdef WEBGL2\n        float numSamples=round(pix/onePixel/4.0+1.0);\n        col.r=0.0;\n        col.b=0.0;\n\n        for(float off=0.0;off<numSamples;off++)\n        {\n            float diff=(pix/numSamples)*off;\n            col.r+=texture(tex,vec2(tc.x+diff,tc.y)).r/numSamples;\n            col.b+=texture(tex,vec2(tc.x-diff,tc.y)).b/numSamples;\n        }\n    #endif\n    #endif\n\n    #ifndef SMOOTH\n        col.r=texture(tex,vec2(tc.x+pix,tc.y)).r;\n        col.b=texture(tex,vec2(tc.x-pix,tc.y)).b;\n    #endif\n\n//   outColor = col;\n   outColor= cgl_blend(base,col,amount);\n\n}\n",};
const
    render=op.inTrigger('render'),
    blendMode=CGL.TextureEffect.AddBlendSelect(op,"Blend Mode","normal"),
    amount=op.inValueSlider("Amount",1),
    pixel=op.inValue("Pixel",5),
    lensDistort=op.inValueSlider("Lens Distort",0),
    doSmooth=op.inValueBool("Smooth",false),
    textureMask=op.inTexture("Mask"),
    trigger=op.outTrigger('trigger');

const cgl=op.patch.cgl;
const shader=new CGL.Shader(cgl,"chromatic");

CGL.TextureEffect.setupBlending(op,shader,blendMode,amount);

shader.setSource(shader.getDefaultVertexShader(),attachments.chromatic_frag);
const textureUniform=new CGL.Uniform(shader,'t','tex',0),
    uniPixel=new CGL.Uniform(shader,'f','pixel',0),
    uniOnePixel=new CGL.Uniform(shader,'f','onePixel',0),
    unitexMask=new CGL.Uniform(shader,'t','texMask',1),
    uniAmount=new CGL.Uniform(shader,'f','amount',amount),
    unilensDistort=new CGL.Uniform(shader,'f','lensDistort',lensDistort);

doSmooth.onChange=function()
{
    if(doSmooth.get())shader.define("SMOOTH");
    else shader.removeDefine("SMOOTH");
};

textureMask.onChange=function()
{
    if(textureMask.get())shader.define("MASK");
    else shader.removeDefine("MASK");
};

render.onTriggered=function()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;

    var texture=cgl.currentTextureEffect.getCurrentSourceTexture();

    uniPixel.setValue(pixel.get()*(1/texture.width));
    uniOnePixel.setValue(1/texture.width);

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, texture.tex );

    if(textureMask.get()) cgl.setTexture(1, textureMask.get().tex );

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.TextureEffects.ChromaticAberration.prototype = new CABLES.Op();
CABLES.OPS["38ac43a1-1757-48f4-9450-29f07ac0d376"]={f:Ops.Gl.TextureEffects.ChromaticAberration,objName:"Ops.Gl.TextureEffects.ChromaticAberration"};




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
// Ops.Gl.TextureEffects.Gradient
// 
// **************************************************************

Ops.Gl.TextureEffects.Gradient = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={gradient_frag:"IN vec2 texCoord;\nUNI float amount;\nUNI float pos;\nUNI float width;\n\nUNI vec3 colA;\nUNI vec3 colB;\nUNI vec3 colC;\nUNI sampler2D tex;\n\n{{CGL.BLENDMODES}}\n\nvoid main()\n{\n    vec4 base=texture(tex,texCoord);\n    vec4 col;\n    float ax=texCoord.x;\n\n    #ifdef GRAD_Y\n        ax=texCoord.y;\n    #endif\n    #ifdef GRAD_XY\n        ax=(texCoord.x+texCoord.y)/2.0;\n    #endif\n    #ifdef GRAD_RADIAL\n        ax=distance(texCoord,vec2(0.5,0.5))*2.0;\n    #endif\n\n    ax=((ax-0.5)*width)+0.5;\n\n    #ifndef GRAD_SMOOTHSTEP\n        if(ax<=pos) col = vec4(mix(colA, colB, ax*1.0/pos),1.0);\n            else col = vec4(mix(colB, colC, min(1.0,(ax-pos)*1.0/(1.0-pos))),1.0);\n    #endif\n\n    #ifdef GRAD_SMOOTHSTEP\n        if(ax<=pos) col = vec4(mix(colA, colB, smoothstep(0.0,1.0,ax*1.0/pos)),1.0);\n            else col = vec4(mix(colB, colC, smoothstep(0.0,1.0,min(1.0,(ax-pos)*1.0/(1.0-pos)))),1.0);\n    #endif\n\n    outColor=cgl_blend(base,col,amount);\n}",};
const render=op.inTrigger("Render");
const blendMode=CGL.TextureEffect.AddBlendSelect(op,"Blend Mode","normal");
const amount=op.inValueSlider("Amount",1);
const width=op.inValue("Width",1);
const gType=op.inSwitch("Type",['X','Y','XY','Radial'],"X");
const pos1=op.inValueSlider("Pos",0.5);
const smoothStep=op.inValueBool("Smoothstep",true);

const r = op.inValueSlider("r", Math.random());
const g = op.inValueSlider("g", Math.random());
const b = op.inValueSlider("b", Math.random());
r.setUiAttribs({ colorPick: true });

const r2 = op.inValueSlider("r2", Math.random());
const g2 = op.inValueSlider("g2", Math.random());
const b2 = op.inValueSlider("b2", Math.random());
r2.setUiAttribs({ colorPick: true });

const r3 = op.inValueSlider("r3", Math.random());
const g3 = op.inValueSlider("g3", Math.random());
const b3 = op.inValueSlider("b3", Math.random());
r3.setUiAttribs({ colorPick: true });

smoothStep.onChange=updateSmoothstep;

op.setPortGroup('Blending',[blendMode,amount]);
op.setPortGroup('Color A',[r,g,b]);
op.setPortGroup('Color B',[r2,g2,b2]);
op.setPortGroup('Color C',[r3,g3,b3]);

const randomize=op.inTriggerButton("Randomize");
var next=op.outTrigger("Next");

var cgl=op.patch.cgl;
var shader=new CGL.Shader(cgl,'gradient');

shader.setSource(shader.getDefaultVertexShader(),attachments.gradient_frag);
var amountUniform=new CGL.Uniform(shader,'f','amount',amount);
var uniPos=new CGL.Uniform(shader,'f','pos',pos1);
var uniWidth=new CGL.Uniform(shader,'f','width',width);
var textureUniform=new CGL.Uniform(shader,'t','tex',0);
var r3uniform,r2uniform,runiform;

r2.onChange=g2.onChange=b2.onChange=updateCol2;
r3.onChange=g3.onChange=b3.onChange=updateCol3;
r.onChange=g.onChange=b.onChange=updateCol;

updateCol();
updateCol2();
updateCol3();
updateSmoothstep();

function updateSmoothstep()
{
    if(smoothStep.get()) shader.define('GRAD_SMOOTHSTEP');
        else shader.removeDefine('GRAD_SMOOTHSTEP');
}

gType.onChange=function()
{
    shader.removeDefine('GRAD_X');
    shader.removeDefine('GRAD_Y');
    shader.removeDefine('GRAD_XY');
    shader.removeDefine('GRAD_RADIAL');

    if(gType.get()=='XY') shader.define('GRAD_XY');
    if(gType.get()=='X') shader.define('GRAD_X');
    if(gType.get()=='Y') shader.define('GRAD_Y');
    if(gType.get()=='Radial')shader.define('GRAD_RADIAL');
};

CGL.TextureEffect.setupBlending(op,shader,blendMode,amount);

randomize.onTriggered=function()
{
    r.set(Math.random());
    g.set(Math.random());
    b.set(Math.random());

    r2.set(Math.random());
    g2.set(Math.random());
    b2.set(Math.random());

    r3.set(Math.random());
    g3.set(Math.random());
    b3.set(Math.random());
};

function updateCol()
{
    var colA=[r.get(),g.get(),b.get()];
    if(!runiform) runiform=new CGL.Uniform(shader,'3f','colA',colA);
        else runiform.setValue(colA);
}

function updateCol2()
{
    var colB=[r2.get(),g2.get(),b2.get()];
    if(!r2uniform) r2uniform=new CGL.Uniform(shader,'3f','colB',colB);
        else r2uniform.setValue(colB);
}

function updateCol3()
{
    var colC=[r3.get(),g3.get(),b3.get()];
    if(!r3uniform) r3uniform=new CGL.Uniform(shader,'3f','colC',colC);
        else r3uniform.setValue(colC);
}

render.onTriggered=function()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();
    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex );
    cgl.currentTextureEffect.finish();
    cgl.popShader();

    next.trigger();
};


};

Ops.Gl.TextureEffects.Gradient.prototype = new CABLES.Op();
CABLES.OPS["5ada9bd8-227a-4a1f-87ad-0f879c7aa84d"]={f:Ops.Gl.TextureEffects.Gradient,objName:"Ops.Gl.TextureEffects.Gradient"};




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
// Ops.Gl.TextureEffects.Desaturate
// 
// **************************************************************

Ops.Gl.TextureEffects.Desaturate = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={desaturate_frag:"\nIN vec2 texCoord;\nUNI sampler2D tex;\nUNI float amount;\n\n#ifdef MASK\n    UNI sampler2D mask;\n#endif\n\nvec3 desaturate(vec3 color, float amount)\n{\n   vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), color));\n   return vec3(mix(color, gray, amount));\n}\n\nvoid main()\n{\n    vec4 col=texture(tex,texCoord);\n\n    float am=amount;\n    #ifdef MASK\n        am*=1.0-texture(mask,texCoord).r;\n        #ifdef INVERTMASK\n        am=1.0-am;\n        #endif\n    #endif\n\n    col.rgb=desaturate(col.rgb,am);\n    outColor= col;\n}",};
const render=op.inTrigger('render');
const trigger=op.outTrigger('trigger');
const amount=op.inValueSlider("amount",1);
const inMask=op.inTexture("Mask");
const invertMask=op.inValueBool("Invert Mask");

const cgl=op.patch.cgl;
const shader=new CGL.Shader(cgl);

shader.setSource(shader.getDefaultVertexShader(),attachments.desaturate_frag);
var textureUniform=new CGL.Uniform(shader,'t','tex',0);
var masktextureUniform=new CGL.Uniform(shader,'t','mask',1);
var amountUniform=new CGL.Uniform(shader,'f','amount',amount);


invertMask.onChange=function()
{
    if(invertMask.get())shader.define("INVERTMASK");
        else shader.removeDefine("INVERTMASK");

};

inMask.onChange=function()
{
    if(inMask.get())shader.define("MASK");
        else shader.removeDefine("MASK");
};

render.onTriggered=function()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

    if(inMask.get()) cgl.setTexture(1, inMask.get().tex );

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.TextureEffects.Desaturate.prototype = new CABLES.Op();
CABLES.OPS["340efbd5-be53-4bd5-92ad-8f38d8eeecf1"]={f:Ops.Gl.TextureEffects.Desaturate,objName:"Ops.Gl.TextureEffects.Desaturate"};




// **************************************************************
// 
// Ops.Gl.Meshes.PointCloudFromArray
// 
// **************************************************************

Ops.Gl.Meshes.PointCloudFromArray = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe=op.inTrigger("exe"),
    arr=op.inArray("Array"),
    numPoints=op.inValueInt("Num Points"),
    outTrigger = op.outTrigger("Trigger out"),
    outGeom=op.outObject("Geometry"),
    pTexCoordRand=op.inValueBool("Scramble Texcoords",true),
    seed=op.inValue("Seed"),
    inCoords=op.inArray("Coordinates"),
    vertCols=op.inArray("Vertex Colors");

const cgl=op.patch.cgl;

inCoords.onChange=updateTexCoordsPorts;
pTexCoordRand.onChange=updateTexCoordsPorts;

vertCols.onChange=seed.onChange=arr.onChange=reset;
numPoints.onChange=updateNumVerts;

op.toWorkPortsNeedToBeLinked(arr,exe);

op.setPortGroup("Texture Coordinates",[pTexCoordRand,seed,inCoords]);


var deactivated=false;
var hasError=false;
var showingError=false;

exe.onTriggered=doRender;

var mesh=null;
const geom=new CGL.Geometry("pointcloudfromarray");
var texCoords=[];
var needsRebuild=true;

function doRender()
{
    outTrigger.trigger();
    if(CABLES.UI)
    {
        var shader=cgl.getShader();
        if(shader && shader.glPrimitive!=cgl.gl.POINTS)
        {
            if(!hasError)
            {
                op.uiAttr( { 'warning': 'using a Material not made for point rendering. maybe use pointMaterial.' } );
                hasError=true;
            }
            return;
        }
        if(hasError)
        {
            op.uiAttr({'warning':null});
            hasError=false;
        }
    }



    if(needsRebuild || !mesh)rebuild();
    if(!deactivated && mesh) mesh.render(cgl.getShader());
}

function reset()
{
    deactivated=arr.get()==null;

    if(!deactivated)needsRebuild=true;
    else needsRebuild=false;
}

function updateTexCoordsPorts()
{
    if(inCoords.isLinked())
    {
        seed.setUiAttribs({greyout:true});
        pTexCoordRand.setUiAttribs({greyout:true});
    }
    else
    {
        pTexCoordRand.setUiAttribs({greyout:false});

        if(!pTexCoordRand.get()) seed.setUiAttribs({greyout:true});
           else seed.setUiAttribs({greyout:false});
    }

    needsRebuild=true;
}

function updateNumVerts()
{
    if(mesh)
    {
        mesh.setNumVertices( Math.min(geom.vertices.length/3,numPoints.get()));
        if(numPoints.get()==0)mesh.setNumVertices(geom.vertices.length/3);
    }
}

function rebuild()
{
    var verts=arr.get();

    if(!verts || verts.length==0)
    {
        // mesh=null;
        return;
    }

    if(geom.vertices.length==verts.length && mesh && !showingError && !inCoords.isLinked() && !vertCols.isLinked())
    {
        mesh.setAttribute(CGL.SHADERVAR_VERTEX_POSITION, verts, 3);
        geom.vertices=verts;
        needsRebuild=false;
        return;
    }


    if(showingError)
    {
        showingError = false;
        op.uiAttr({error:null});
    }

    var divisibleBy3 = verts.length % 3 === 0;

    if(divisibleBy3 === false)
    {
        if(!showingError)
        {
            op.uiAttr({error:"Array length not divisible by 3!"});
            showingError = true;
        }
        return;
    }

    geom.clear();
    var num=verts.length/3;
    num=Math.abs(Math.floor(num));


    if(num==0)return;

    if(!texCoords || texCoords.length!=num*2) texCoords=new Float32Array(num*2); //num*2;//=

    var changed=false;
    var rndTc=pTexCoordRand.get();

    Math.randomSeed=seed.get();
    var genCoords=!inCoords.isLinked();
    changed=!inCoords.isLinked();

    for(var i=0;i<num;i++)
    {
        if(geom.vertices[i*3]!=verts[i*3] ||
            geom.vertices[i*3+1]!=verts[i*3+1] ||
            geom.vertices[i*3+2]!=verts[i*3+2])
        {
            if(genCoords)
            if(rndTc)
            {
                texCoords[i*2]=Math.seededRandom();
                texCoords[i*2+1]=Math.seededRandom();
            }
            else
            {
                texCoords[i*2]=i/num;
                texCoords[i*2+1]=i/num;
            }
            changed=true;
        }
    }

    if(vertCols.get())
    {
        if(!showingError && vertCols.get().length!=num*4)
        {
            op.uiAttr({error:"Color array does not have the correct length! (should be "+num*4+")"});
            showingError = true;
            mesh=null;
            return;
        }

        geom.vertexColors=vertCols.get();
    }
    else geom.vertexColors=[];

    if(changed)
    {
        if(!genCoords) texCoords = inCoords.get();

        geom.setPointVertices(verts);
        geom.setTexCoords(texCoords);
        geom.verticesIndices=[];

        if(mesh)mesh.dispose();
        mesh=new CGL.Mesh(cgl,geom,cgl.gl.POINTS);

        mesh.addVertexNumbers=true;
        mesh.setGeom(geom);
        outGeom.set(geom);
    }

    updateNumVerts();
    needsRebuild=false;
}





};

Ops.Gl.Meshes.PointCloudFromArray.prototype = new CABLES.Op();
CABLES.OPS["0a6d9c6f-6459-45ca-88ad-268a1f7304db"]={f:Ops.Gl.Meshes.PointCloudFromArray,objName:"Ops.Gl.Meshes.PointCloudFromArray"};




// **************************************************************
// 
// Ops.Gl.Shader.PointMaterial_v2
// 
// **************************************************************

Ops.Gl.Shader.PointMaterial_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={shader_frag:"\n{{MODULES_HEAD}}\n\nUNI vec4 color;\nIN vec2 texCoord;\nIN vec2 pointCoord;\n\n#ifdef HAS_TEXTURE_DIFFUSE\n    UNI sampler2D diffTex;\n#endif\n#ifdef HAS_TEXTURE_MASK\n    UNI sampler2D texMask;\n#endif\n#ifdef HAS_TEXTURE_COLORIZE\n    IN vec4 colorize;\n#endif\n#ifdef VERTEX_COLORS\n    IN vec3 vertexColor;\n#endif\n\nvoid main()\n{\n    {{MODULE_BEGIN_FRAG}}\n\n    #ifdef FLIP_TEX\n        vec2 pointCoord=vec2(gl_PointCoord.x,(1.0-gl_PointCoord.y));\n    #endif\n    #ifndef FLIP_TEX\n        vec2 pointCoord=gl_PointCoord;\n    #endif\n\n    vec4 col=color;\n\n    #ifdef HAS_TEXTURES\n\n        #ifdef HAS_TEXTURE_MASK\n            float mask;\n            mask=texture(texMask,pointCoord).r;\n        #endif\n\n        #ifdef HAS_TEXTURE_DIFFUSE\n            col=texture(diffTex,pointCoord);\n            #ifdef COLORIZE_TEXTURE\n              col.rgb*=color.rgb;\n            #endif\n        #endif\n        col.a*=color.a;\n    #endif\n\n    {{MODULE_COLOR}}\n\n    #ifdef MAKE_ROUND\n        if ((gl_PointCoord.x-0.5)*(gl_PointCoord.x-0.5) + (gl_PointCoord.y-0.5)*(gl_PointCoord.y-0.5) > 0.25) discard; //col.a=0.0;\n    #endif\n\n    #ifdef VERTEX_COLORS\n        col.rgb*=vertexColor;\n    #endif\n\n    #ifdef HAS_TEXTURE_COLORIZE\n        col*=colorize;\n    #endif\n\n    #ifdef HAS_TEXTURE_MASK\n        col.a=mask;\n    #endif\n\n    outColor = col;\n}\n",shader_vert:"{{MODULES_HEAD}}\nIN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN vec3 attrVertNormal;\nIN vec3 attrTangent;\nIN vec3 attrBiTangent;\n\n#ifdef VERTEX_COLORS\n    IN vec3 attrVertColor;\n    OUT vec3 vertexColor;\n#endif\n\nOUT vec3 norm;\n#ifdef HAS_TEXTURES\n    OUT vec2 texCoord;\n#endif\n#ifdef HAS_TEXTURE_COLORIZE\n   UNI sampler2D texColorize;\n   OUT vec4 colorize;\n#endif\n\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\n\nUNI float pointSize;\nUNI vec3 camPos;\n\nUNI float canvasWidth;\nUNI float canvasHeight;\nUNI float camDistMul;\nUNI float randomSize;\n\nIN float attrVertIndex;\n\n\nfloat rand(float n){return fract(sin(n) * 5711.5711123);}\n\n#define POINTMATERIAL\n\nvoid main()\n{\n    float psMul=sqrt(canvasWidth/canvasHeight)+0.00000000001;\n    float sizeMultiply=1.0;\n\n    vec3 tangent=attrTangent;\n    vec3 bitangent=attrBiTangent;\n\n\n    #ifdef VERTEX_COLORS\n        vertexColor=attrVertColor;\n    #endif\n\n    #ifdef HAS_TEXTURES\n        texCoord=attrTexCoord;\n    #endif\n\n    #ifdef HAS_TEXTURE_COLORIZE\n        #ifdef RANDOM_COLORIZE\n            colorize=texture(texColorize,vec2(rand(attrVertIndex+texCoord.x*texCoord.y+texCoord.y+texCoord.x),rand(texCoord.y*texCoord.x-texCoord.x-texCoord.y-attrVertIndex)));\n        #endif\n        #ifndef RANDOM_COLORIZE\n            colorize=texture(texColorize,texCoord);\n        #endif\n    #endif\n\n    mat4 mMatrix=modelMatrix;\n    vec4 pos = vec4( vPosition, 1. );\n\n    {{MODULE_VERTEX_POSITION}}\n\n    vec4 model=mMatrix * pos;\n\n    psMul+=rand(texCoord.x*texCoord.y+texCoord.y*3.0+texCoord.x*2.0+attrVertIndex)*randomSize;\n    psMul*=sizeMultiply;\n\n    #ifndef SCALE_BY_DISTANCE\n        gl_PointSize = pointSize * psMul;\n    #endif\n    #ifdef SCALE_BY_DISTANCE\n        float cameraDist = distance(model.xyz, camPos);\n        gl_PointSize = (pointSize / cameraDist) * psMul;\n    #endif\n\n    gl_Position = projMatrix * viewMatrix * model;\n}\n",};
const cgl=op.patch.cgl;

const
    render=op.inTrigger("render"),
    pointSize=op.inValueFloat("PointSize",3),
    randomSize=op.inValue("Random Size",3),
    makeRound=op.inValueBool("Round",true),
    doScale=op.inValueBool("Scale by Distance",false),
    r = op.inValueSlider("r", Math.random()),
    g = op.inValueSlider("g", Math.random()),
    b = op.inValueSlider("b", Math.random()),
    a = op.inValueSlider("a",1),
    preMultipliedAlpha=op.inValueBool("preMultiplied alpha"),
    vertCols=op.inBool("Vertex Colors",false),
    texture=op.inTexture("texture"),
    textureMask=op.inTexture("Texture Mask"),
    textureColorize=op.inTexture("Texture Colorize"),
    colorizeRandom=op.inValueBool("Colorize Randomize",true),
    flipTex=op.inValueBool("Flip Texture",false),

    trigger=op.outTrigger('trigger'),
    shaderOut=op.outObject("shader");

op.setPortGroup("Texture",[texture,textureMask,textureColorize]);
op.setPortGroup("Color",[r,g,b,a,preMultipliedAlpha,vertCols]);
op.setPortGroup("Size",[pointSize,randomSize,makeRound,doScale]);
r.setUiAttribs({ colorPick: true });

const shader=new CGL.Shader(cgl,'PointMaterial');
shader.setModules(['MODULE_VERTEX_POSITION','MODULE_COLOR','MODULE_BEGIN_FRAG']);
shader.define('MAKE_ROUND');

const
    uniPointSize=new CGL.Uniform(shader,'f','pointSize',pointSize),
    uniRandomSize=new CGL.Uniform(shader,'f','randomSize',randomSize),
    uniColor=new CGL.Uniform(shader,'4f','color',r,g,b,a),
    uniWidth=new CGL.Uniform(shader,'f','canvasWidth',cgl.canvasWidth),
    uniHeight=new CGL.Uniform(shader,'f','canvasHeight',cgl.canvasHeight),
    textureUniform=new CGL.Uniform(shader,'t','diffTex',0),
    textureColorizeUniform=new CGL.Uniform(shader,'t','texColorize',0),
    textureMaskUniform=new CGL.Uniform(shader,'t','texMask',0);

shader.setSource(attachments.shader_vert,attachments.shader_frag);
shader.glPrimitive=cgl.gl.POINTS;
shaderOut.set(shader);
shaderOut.ignoreValueSerialize=true;

render.onTriggered=doRender;
doScale.onChange=
    makeRound.onChange=
    texture.onChange=
    textureColorize.onChange=
    textureMask.onChange=
    colorizeRandom.onChange=
    flipTex.onChange=
    textureColorize.onChange=
    vertCols.onChange=updateDefines;


op.preRender=function()
{
    if(shader)shader.bind();
    doRender();
};


function doRender()
{
    uniWidth.setValue(cgl.canvasWidth);
    uniHeight.setValue(cgl.canvasHeight);

    cgl.pushShader(shader);
    shader.popTextures();
    if(texture.get()) shader.pushTexture(textureUniform, texture.get().tex);
    if(textureMask.get()) shader.pushTexture(textureMaskUniform, textureMask.get().tex);
    if(textureColorize.get()) shader.pushTexture(textureColorizeUniform, textureColorize.get().tex);


    if(preMultipliedAlpha.get())cgl.gl.blendFunc(cgl.gl.ONE, cgl.gl.ONE_MINUS_SRC_ALPHA);

    trigger.trigger();

    if(preMultipliedAlpha.get())cgl.gl.blendFunc(cgl.gl.SRC_ALPHA,cgl.gl.ONE_MINUS_SRC_ALPHA);

    cgl.popShader();
}


function updateDefines()
{
    shader.toggleDefine('SCALE_BY_DISTANCE',doScale.get());
    shader.toggleDefine('MAKE_ROUND',makeRound.get());
    shader.toggleDefine('VERTEX_COLORS',vertCols.get());
    shader.toggleDefine('RANDOM_COLORIZE',colorizeRandom.get());
    shader.toggleDefine('HAS_TEXTURE_DIFFUSE',texture.get());
    shader.toggleDefine('HAS_TEXTURE_MASK',textureMask.get());
    shader.toggleDefine('HAS_TEXTURE_COLORIZE',textureColorize.get());
    shader.toggleDefine('FLIP_TEX',flipTex.get());

}



};

Ops.Gl.Shader.PointMaterial_v2.prototype = new CABLES.Op();
CABLES.OPS["e545a244-1593-4fa9-a56b-de2487bccae9"]={f:Ops.Gl.Shader.PointMaterial_v2,objName:"Ops.Gl.Shader.PointMaterial_v2"};




// **************************************************************
// 
// Ops.Points.PointsCube
// 
// **************************************************************

Ops.Points.PointsCube = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const numx=op.inValueInt("num x",5),
    numy=op.inValueInt("num y",5),
    numz=op.inValueInt("num z",5),
    mul=op.inValue("mul",1),
    center=op.inValueBool("center",true),
    outArray = op.outArray("Array out"),
    idx=op.outValue("Total points"),
    arrayLengthOut = op.outNumber("Array length");

var newArr=[];
outArray.set(newArr);

numx.onChange=
numy.onChange=
numz.onChange=
mul.onChange=
center.onChange= update;

function update()
{
    newArr.length = 0;

    var subX=0;
    var subY=0;
    var subZ=0;

    if(center.get())
    {
        subX=( (numx.get()-1)*mul.get())/2.0;
        subY=( (numy.get()-1)*mul.get())/2.0;
        subZ=( (numz.get()-1)*mul.get())/2.0;
    }

    var xTemp = 0;
    var yTemp = 0;
    var zTemp = 0;

    var m=mul.get();

    for(var z=0;z<numz.get();z++)
    {
        zTemp = (z*m) - subZ;

        for(var y=0;y<numy.get();y++)
        {
            yTemp = (y*m) - subY;

            for(var x=0;x<numx.get();x++)
            {
                xTemp = (x*m) - subX;

                newArr.push(xTemp);
                newArr.push(yTemp);
                newArr.push(zTemp);

            }
        }
    }
    idx.set(x*y*z);
    outArray.set(null);
    outArray.set(newArr);
    arrayLengthOut.set(newArr.length);
};
update();

};

Ops.Points.PointsCube.prototype = new CABLES.Op();
CABLES.OPS["6030193b-089c-4565-a7b8-d837501ded52"]={f:Ops.Points.PointsCube,objName:"Ops.Points.PointsCube"};




// **************************************************************
// 
// Ops.Array.Array3RandomSelection
// 
// **************************************************************

Ops.Array.Array3RandomSelection = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inArray=op.inArray("Array"),
    inNum=op.inValueInt("Elements",10),
    inSeed=op.inValue("Seed",0),
    result=op.outArray("Result"),
    outTotalPoints = op.outNumber("Total points"),
    outArrayLength = op.outNumber("Array length");

var arr=[];
inSeed.onChange=inArray.onChange=inNum.onChange=update;

function update()
{
    if(Math.floor(inNum.get())<0 || !inArray.get())
    {
        result.set(null);
        outTotalPoints.set(0);
        outArrayLength.set(0);
        return;
    }

    var oldArr=inArray.get();

    arr.length=Math.floor(inNum.get()*3);

    // if(arr.length>oldArr.length)arr.length=oldArr.length;
    var nums=[];
    for(var i=0;i<Math.max(arr.length/3,oldArr.length/3);i++)
        nums[i]=i%(oldArr.length/3);

    nums=CABLES.shuffleArray(nums);

    Math.randomSeed=inSeed.get();

    for(var i=0;i<inNum.get();i++)
    {
        var index=nums[i]*3;
        //var index=Math.floor((Math.seededRandom()*oldArr.length/3))*3;
        arr[i*3+0]=oldArr[index+0];
        arr[i*3+1]=oldArr[index+1];
        arr[i*3+2]=oldArr[index+2];
    }

    result.set(null);
    result.set(arr);
    outTotalPoints.set(arr.length/3);
    outArrayLength.set(arr.length);
}

};

Ops.Array.Array3RandomSelection.prototype = new CABLES.Op();
CABLES.OPS["c6967443-9d2a-4d3a-8d8c-eab529f52518"]={f:Ops.Array.Array3RandomSelection,objName:"Ops.Array.Array3RandomSelection"};




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
// Ops.Array.SmoothArray
// 
// **************************************************************

Ops.Array.SmoothArray = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
//look at http://sol.gfxile.net/interpolation/
const exec=op.inTrigger("Execute"),
    inArray = op.inArray("Array In"),
    inModeBool = op.inBool("Separate inc/dec",false),
    incFactor=op.inValue("Inc factor",4),
    decFactor=op.inValue("Dec factor",4),
    next=op.outTrigger("Next"),
    outArray = op.outArray("Array Out");

var goal=[];
var reset=false;
var lastTrigger=0;

var newArr = [];
outArray.set(newArr);

var divisorUp;
var divisorDown;

var selectedMode = false;

onFilterChange();
getDivisors();
function onFilterChange()
{
    selectedMode = inModeBool.get();

    if(selectedMode === false)
    {
        decFactor.setUiAttribs({greyout:true});
        incFactor.setUiAttribs({title:"Inc/Dec factor"});
    }
    else if (selectedMode ===true)
    {
        decFactor.setUiAttribs({greyout:false});
        incFactor.setUiAttribs({title:"Inc factor"});
    }

    getDivisors();
    update();
};

function getDivisors()
{
    if(selectedMode == false)
    {
        divisorUp=incFactor.get();
        divisorDown=incFactor.get();
    }
    else if (selectedMode === true)
    {
        divisorUp=incFactor.get();
        divisorDown=decFactor.get();
    }

    if(divisorUp<=0 || divisorUp != divisorUp )divisorUp=0.0001;
    if(divisorDown<=0 || divisorDown != divisorDown )divisorDown=0.0001;
    if(divisorUp <= 1.0) divisorUp = 1.0;
    if(divisorDown <= 1.0) divisorDown = 1.0;
};

inArray.onChange=function()
{
    var arr = inArray.get();
    if(!arr)return;

    for (var i = 0 ; i < arr.length;i++)
    {
        goal[i]=arr[i];
    }
};

var oldVal=0;

function update()
{
    var arr = inArray.get();
    if(!arr)return;

    if(newArr.length != arr.length)
    {
        newArr.length = arr.length;
        reset=true;
    }

    var tm=1;
    if(CABLES.now()-lastTrigger>500 || lastTrigger===0)reset = true;
        else tm=(CABLES.now()-lastTrigger)/17;
    lastTrigger=CABLES.now();

    if(reset)
    {
        for(var i = 0; i < arr.length; i++)
        {
            newArr[i]=arr[i];
        }
        reset=false;
    }

    for(var i = 0;i < arr.length;i++)
    {
        var val = newArr[i];


        var diff = goal[i]-val;

        if(diff  >= 0)
            val=val+(diff)/(divisorDown*tm);
        else
            val=val+(diff)/(divisorUp*tm);

        if(val>0 && val<0.000000001)val=0;


        if(newArr[i]!=val)
        {
            newArr[i] = val;
            oldVal=val;
        }
    }
    outArray.set(null);
    outArray.set(newArr);

    next.trigger();
};

exec.onTriggered = function()
{
    update();
};

incFactor.onChange = decFactor.onChange = getDivisors;
inModeBool.onChange = onFilterChange;
update();

};

Ops.Array.SmoothArray.prototype = new CABLES.Op();
CABLES.OPS["8fd2ed9b-02e5-4349-b7bc-6665ca240ffa"]={f:Ops.Array.SmoothArray,objName:"Ops.Array.SmoothArray"};




// **************************************************************
// 
// Ops.Gl.Meshes.Rectangle_v2
// 
// **************************************************************

Ops.Gl.Meshes.Rectangle_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    render=op.inTrigger("render"),
    trigger=op.outTrigger('trigger'),
    width=op.inValue("width",1),
    height=op.inValue("height",1),
    pivotX=op.inSwitch("pivot x",["left","center","right"]),
    pivotY=op.inSwitch("pivot y",["top","center","bottom"]),
    nColumns=op.inValueInt("num columns",1),
    nRows=op.inValueInt("num rows",1),
    axis=op.inSwitch("axis",["xy","xz"],"xy"),
    active=op.inValueBool('Active',true),
    geomOut=op.outObject("geometry");

geomOut.ignoreValueSerialize=true;

var cgl=op.patch.cgl;
axis.set('xy');
pivotX.set('center');
pivotY.set('center');

op.setPortGroup('Pivot',[pivotX,pivotY]);
op.setPortGroup('Size',[width,height]);
op.setPortGroup('Structure',[nColumns,nRows]);
op.toWorkPortsNeedToBeLinked(render);

var geom=new CGL.Geometry('rectangle');
var mesh=null;
var needsRebuild=false;

axis.onChange=
    pivotX.onChange=
    pivotY.onChange=
    width.onChange=
    height.onChange=
    nRows.onChange=
    nColumns.onChange=rebuildLater;
rebuild();

function rebuildLater()
{
    needsRebuild=true;
}

op.preRender=
render.onTriggered=function()
{
    if(!CGL.TextureEffect.checkOpNotInTextureEffect(op)) return;
    if(needsRebuild)rebuild();
    if(active.get() && mesh) mesh.render(cgl.getShader());
    trigger.trigger();
};

function rebuild()
{
    var w=width.get();
    var h=parseFloat(height.get());
    var x=0;
    var y=0;

    if(typeof w=='string')w=parseFloat(w);
    if(typeof h=='string')h=parseFloat(h);

    if(pivotX.get()=='center') x=0;
    else if(pivotX.get()=='right') x=-w/2;
    else if(pivotX.get()=='left') x=+w/2;

    if(pivotY.get()=='center') y=0;
    else if(pivotY.get()=='top') y=-h/2;
    else if(pivotY.get()=='bottom') y=+h/2;

    var verts=[];
    var tc=[];
    var norms=[];
    var tangents=[];
    var biTangents=[];
    var indices=[];

    var numRows=Math.round(nRows.get());
    var numColumns=Math.round(nColumns.get());

    var stepColumn=w/numColumns;
    var stepRow=h/numRows;

    var c,r,a;
    a=axis.get();
    for(r=0;r<=numRows;r++)
    {
        for(c=0;c<=numColumns;c++)
        {
            verts.push( c*stepColumn - width.get()/2+x );
            if(a=='xz') verts.push( 0.0 );
            verts.push( r*stepRow - height.get()/2+y );
            if(a=='xy') verts.push( 0.0 );

            tc.push( c/numColumns );
            tc.push( 1.0-r/numRows );

            if(a=='xz')
            {
                norms.push(0,1,0);
                tangents.push(1,0,0);
                biTangents.push(0,0,1);
            }
            else if(a=='xy')
            {
                norms.push(0,0,1);
                tangents.push(-1,0,0);
                biTangents.push(0,-1,0);
            }
        }
    }

    for(c=0;c<numColumns;c++)
    {
        for(r=0;r<numRows;r++)
        {
            var ind = c+(numColumns+1)*r;
            var v1=ind;
            var v2=ind+1;
            var v3=ind+numColumns+1;
            var v4=ind+1+numColumns+1;

            indices.push(v1);
            indices.push(v3);
            indices.push(v2);

            indices.push(v2);
            indices.push(v3);
            indices.push(v4);
        }
    }

    geom.clear();
    geom.vertices=verts;
    geom.texCoords=tc;
    geom.verticesIndices=indices;
    geom.vertexNormals=norms;
    geom.tangents=tangents;
    geom.biTangents=biTangents;

    if(numColumns*numRows>64000)geom.unIndex();

    if(!mesh) mesh=new CGL.Mesh(cgl,geom);
    else mesh.setGeom(geom);

    geomOut.set(null);
    geomOut.set(geom);
    needsRebuild=false;
}

op.onDelete=function()
{
    if(mesh)mesh.dispose();
}




};

Ops.Gl.Meshes.Rectangle_v2.prototype = new CABLES.Op();
CABLES.OPS["fc5718d6-11a5-496e-8f16-1c78b1a2824c"]={f:Ops.Gl.Meshes.Rectangle_v2,objName:"Ops.Gl.Meshes.Rectangle_v2"};




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
// Ops.Gl.TextureEffects.Vibrance
// 
// **************************************************************

Ops.Gl.TextureEffects.Vibrance = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={vibrance_frag:"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI float amount;\n\nconst vec4 lumcoeff = vec4(0.299,0.587,0.114, 0.);\n\nvoid main()\n{\n   vec4 col=vec4(1.0,0.0,0.0,1.0);\n   col=texture(tex,texCoord);\n\n   float luma = dot(col, lumcoeff);\n   vec4 mask = (col - vec4(luma));\n   mask = clamp(mask, 0.0, 1.0);\n   float lumaMask = dot(lumcoeff, mask);\n   lumaMask = 1.0 - lumaMask;\n   vec4 vibrance = mix(vec4(luma), col, 1.0 + amount * lumaMask);\n   outColor= vibrance;\n}",};
const render=op.inTrigger("Render");
const trigger=op.outTrigger("Trigger");
const amount=op.inValue("amount",2);

const cgl=op.patch.cgl;
const shader=new CGL.Shader(cgl);

shader.setSource(shader.getDefaultVertexShader(),attachments.vibrance_frag);
const textureUniform=new CGL.Uniform(shader,'t','tex',0);
const amountUniform=new CGL.Uniform(shader,'f','amount',amount);

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

Ops.Gl.TextureEffects.Vibrance.prototype = new CABLES.Op();
CABLES.OPS["9c71c980-e439-4397-9c2b-c2ae085eaed9"]={f:Ops.Gl.TextureEffects.Vibrance,objName:"Ops.Gl.TextureEffects.Vibrance"};




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
// Ops.Html.FontFile
// 
// **************************************************************

Ops.Html.FontFile = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    filename=op.inFile("file"),
    fontname=op.inValueString("family"),
    outLoaded=op.outValue("Loaded"),
    loadedTrigger=op.outTrigger("Loaded Trigger");

filename.onChange=function()
    {
        outLoaded.set(false);
        addStyle();
    };

fontname.onChange=addStyle;

var fontFaceObj;

function addStyle()
{
    if(filename.get() && fontname.get())
    {
        if(document.fonts) {
            fontFaceObj = new FontFace(fontname.get(), 'url(' + op.patch.getFilePath(String(filename.get()))+ ')');
            //console.log(fontFaceObj);

            // Add the FontFace to the FontFaceSet
            document.fonts.add(fontFaceObj);

            // Get the current status of the FontFace
            // (should be 'unloaded')
            // console.info('Current status', fontFaceObj.status);

            // Load the FontFace
            fontFaceObj.load();

            // Get the current status of the Fontface
            // (should be 'loading' or 'loaded' if cached)
            // console.info('Current status', fontFaceObj.status);

            // Wait until the font has been loaded, log the current status.
            fontFaceObj.loaded.then((fontFace) => {
                // console.info('Current status', fontFace.status);
                // console.log(fontFace.family, 'loaded successfully.');
                outLoaded.set(true);
                loadedTrigger.trigger();

                // Throw an error if loading wasn't successful
            }, (fontFace) => {
            console.error('Font loading error! Current status', fontFaceObj.status);
            });
        } else { // font loading api not supported
            var fileUrl=op.patch.getFilePath(String(filename.get()));
            var styleStr=''
                .endl()+'@font-face'
                .endl()+'{'
                .endl()+'  font-family: "'+fontname.get()+'";'
                .endl()+'  src: url("'+fileUrl+'") format("truetype");'
                .endl()+'}';

            var style = document.createElement('style');
            style.type = 'text/css';
            style.innerHTML = styleStr;
            document.getElementsByTagName('head')[document.getElementsByTagName('head').length-1].appendChild(style);
            // TODO: Poll if font loaded
        }
    }
}


};

Ops.Html.FontFile.prototype = new CABLES.Op();
CABLES.OPS["0cf90109-cccd-4633-9c77-8aaf53eae15c"]={f:Ops.Html.FontFile,objName:"Ops.Html.FontFile"};




// **************************************************************
// 
// Ops.Gl.Meshes.TextMesh_v2
// 
// **************************************************************

Ops.Gl.Meshes.TextMesh_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={textmesh_frag:"UNI sampler2D tex;\n#ifdef DO_MULTEX\n    UNI sampler2D texMul;\n#endif\n#ifdef DO_MULTEX_MASK\n    UNI sampler2D texMulMask;\n#endif\nIN vec2 texCoord;\nIN vec2 texPos;\nUNI float r;\nUNI float g;\nUNI float b;\nUNI float a;\n\nvoid main()\n{\n   vec4 col=texture(tex,texCoord);\n   col.a=col.r;\n   col.r*=r;\n   col.g*=g;\n   col.b*=b;\n   col*=a;\n   if(col.a==0.0)discard;\n\n    #ifdef DO_MULTEX\n        col*=texture(texMul,texPos);\n    #endif\n\n    #ifdef DO_MULTEX_MASK\n        col*=texture(texMulMask,texPos).r;\n    #endif\n\n\n   outColor=col;\n}",textmesh_vert:"UNI sampler2D tex;\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\nUNI float scale;\nIN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN mat4 instMat;\nIN vec2 attrTexOffsets;\nIN vec2 attrTexSize;\nIN vec2 attrTexPos;\nOUT vec2 texPos;\n\nOUT vec2 texCoord;\n\nvoid main()\n{\n   texCoord=(attrTexCoord*(attrTexSize)) + attrTexOffsets;\n   mat4 instModelMat=instMat;\n   instModelMat[3][0]*=scale;\n\n   texPos=attrTexPos;\n\n   vec4 vert=vec4( vPosition.x*(attrTexSize.x/attrTexSize.y)*scale,vPosition.y*scale,vPosition.z*scale, 1. );\n\n   mat4 mvMatrix=viewMatrix * modelMatrix * instModelMat;\n\n   #ifndef BILLBOARD\n       gl_Position = projMatrix * mvMatrix * vert;\n   #endif\n}\n",};
const
    render=op.inTrigger("Render"),
    str=op.inString("Text","cables"),
    scale=op.inValueFloat("Scale",1),
    inFont=op.inString("Font","Arial"),
    align=op.inValueSelect("align",['left','center','right'],'center'),
    valign=op.inValueSelect("vertical align",['Top','Middle','Bottom'],'Middle'),
    lineHeight=op.inValueFloat("Line Height",1),
    letterSpace=op.inValueFloat("Letter Spacing"),
    inMulTex=op.inTexture("Texture Color"),
    inMulTexMask=op.inTexture("Texture Mask"),
    next=op.outTrigger("Next"),
    textureOut=op.outTexture("texture"),
    outLines=op.outNumber("Total Lines",0),
    loaded=op.outValue("Font Available",0);

const cgl=op.patch.cgl;


op.setPortGroup("Masking",[inMulTex,inMulTexMask]);

const filter=CGL.Texture.FILTER_MIPMAP;
const textureSize=1024;
var fontLoaded=false;
var needUpdate=true;

align.onChange=
    str.onChange=
    lineHeight.onChange=generateMeshLater;


function generateMeshLater()
{
    needUpdate=true;
}

var canvasid=null;
CABLES.OpTextureMeshCanvas={};
var valignMode=0;


var geom=null;
var mesh=null;

var createMesh=true;
var createTexture=true;

inMulTexMask.onChange=
inMulTex.onChange=function()
{
    shader.toggleDefine("DO_MULTEX",inMulTex.get());
    shader.toggleDefine("DO_MULTEX_MASK",inMulTexMask.get());

};

textureOut.set(null);
inFont.onChange=function()
    {
        createTexture=true;
        createMesh=true;
        checkFont();
    };

function checkFont()
{
    var oldFontLoaded=fontLoaded;
    try
    {
        fontLoaded=document.fonts.check('20px "'+inFont.get()+'"');
    }
    catch(ex)
    {
        console.log(ex);
    }

    if(!oldFontLoaded && fontLoaded)
    {
        loaded.set(true);
        createTexture=true;
        createMesh=true;
    }

    if(!fontLoaded) setTimeout(checkFont,250);
}


valign.onChange=function()
{
    if(valign.get()=='Middle')valignMode=0;
    else if(valign.get()=='Top')valignMode=1;
    else if(valign.get()=='Bottom')valignMode=2;
};

function getFont()
{
    canvasid=''+inFont.get();
    if(CABLES.OpTextureMeshCanvas.hasOwnProperty(canvasid))
        return CABLES.OpTextureMeshCanvas[canvasid];

    var fontImage = document.createElement('canvas');
    fontImage.dataset.font=inFont.get();
    fontImage.id = "texturetext_"+CABLES.generateUUID();
    fontImage.style.display = "none";
    var body = document.getElementsByTagName("body")[0];
    body.appendChild(fontImage);
    var _ctx= fontImage.getContext('2d');
    CABLES.OpTextureMeshCanvas[canvasid]=
        {
            ctx:_ctx,
            canvas:fontImage,
            chars:{},
            characters:'?',
            fontSize:320
        };
    return CABLES.OpTextureMeshCanvas[canvasid];
}

op.onDelete=function()
{
    if(canvasid && CABLES.OpTextureMeshCanvas[canvasid])
        CABLES.OpTextureMeshCanvas[canvasid].canvas.remove();
};

var shader=new CGL.Shader(cgl,'TextMesh');
shader.setSource(attachments.textmesh_vert,attachments.textmesh_frag);
var uniTex=new CGL.Uniform(shader,'t','tex',0);
var uniTexMul=new CGL.Uniform(shader,'t','texMul',1);
var uniTexMulMask=new CGL.Uniform(shader,'t','texMulMask',2);
var uniScale=new CGL.Uniform(shader,'f','scale',scale);

const
    r = op.inValueSlider("r", 1),
    g = op.inValueSlider("g", 1),
    b = op.inValueSlider("b", 1),
    a = op.inValueSlider("a", 1),
    runiform=new CGL.Uniform(shader,'f','r',r),
    guniform=new CGL.Uniform(shader,'f','g',g),
    buniform=new CGL.Uniform(shader,'f','b',b),
    auniform=new CGL.Uniform(shader,'f','a',a);
r.setUiAttribs({ colorPick: true });

op.setPortGroup('Display',[scale,inFont]);
op.setPortGroup('Alignment',[align,valign]);
op.setPortGroup('Color',[r,g,b,a]);


var height=0;
var vec=vec3.create();
var lastTextureChange=-1;
var disabled=false;

render.onTriggered=function()
{
    if(needUpdate)
    {
        generateMesh();
        needUpdate=false;
    }
    var font=getFont();
    if(font.lastChange!=lastTextureChange)
    {
        createMesh=true;
        lastTextureChange=font.lastChange;
    }

    if(createTexture) generateTexture();
    if(createMesh)generateMesh();

    if(mesh && mesh.numInstances>0)
    {
        cgl.pushBlendMode(CGL.BLEND_NORMAL,true);
        cgl.setShader(shader);
        cgl.setTexture(0,textureOut.get().tex);

        var mulTex=inMulTex.get();
        if(mulTex)cgl.setTexture(1,mulTex.tex);

        var mulTexMask=inMulTexMask.get();
        if(mulTexMask)cgl.setTexture(2,mulTexMask.tex);

        if(valignMode===2) vec3.set(vec, 0,height,0);
        else if(valignMode===1) vec3.set(vec, 0,0,0);
        else if(valignMode===0) vec3.set(vec, 0,height/2,0);

        vec[1]-=lineHeight.get();
        cgl.pushModelMatrix();
        mat4.translate(cgl.mMatrix,cgl.mMatrix, vec);
        if(!disabled)mesh.render(cgl.getShader());

        cgl.popModelMatrix();

        cgl.setTexture(0,null);
        cgl.setPreviousShader();
        cgl.popBlendMode();
    }

    next.trigger();
};

letterSpace.onChange=function()
{
    createMesh=true;
};


function generateMesh()
{
    var theString=String(str.get()+'');
    if(!textureOut.get())return;

    var font=getFont();
    if(!font.geom)
    {
        font.geom=new CGL.Geometry("textmesh");

        font.geom.vertices = [
            1.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            1.0, 0.0, 0.0,
            0.0, 0.0, 0.0
        ];

        font.geom.texCoords = new Float32Array([
            1.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            0.0, 0.0
        ]);

        font.geom.verticesIndices = [
            0, 1, 2,
            3, 1, 2
        ];
    }

    if(!mesh)mesh=new CGL.Mesh(cgl,font.geom);

    var strings=(theString).split('\n');
    outLines.set(strings.length);

    var transformations=[];
    var tcOffsets=[];//new Float32Array(str.get().length*2);
    var tcSize=[];//new Float32Array(str.get().length*2);
    var texPos=[];
    var charCounter=0;
    createTexture=false;
    var m=mat4.create();


    for(var s=0;s<strings.length;s++)
    {
        var txt=strings[s];
        var numChars=txt.length;

        var pos=0;
        var offX=0;
        var width=0;

        for(var i=0;i<numChars;i++)
        {
            var chStr=txt.substring(i,i+1);
            var char=font.chars[String(chStr)];
            if(char)
            {
                width+=(char.texCoordWidth/char.texCoordHeight);
                width+=letterSpace.get();
            }
        }
        width-=letterSpace.get();

        height=0;

        if(align.get()=='left') offX=0;
        else if(align.get()=='right') offX=width;
        else if(align.get()=='center') offX=width/2;

        height=(s+1)*lineHeight.get();

        for(var i=0;i<numChars;i++)
        {
            const chStr=txt.substring(i,i+1);
            const char=font.chars[String(chStr)];

            if(!char)
            {
                createTexture=true;
                return;
            }
            else
            {
                texPos.push(pos/width*0.99+0.005,(1.0-(s/(strings.length-1)))*0.99+0.005);
                tcOffsets.push(char.texCoordX,1-char.texCoordY-char.texCoordHeight);
                tcSize.push(char.texCoordWidth,char.texCoordHeight);

                mat4.identity(m);
                mat4.translate(m,m,[pos-offX,0-s*lineHeight.get(),0]);

                pos+=(char.texCoordWidth/char.texCoordHeight)+letterSpace.get();
                transformations.push(Array.prototype.slice.call(m));

                charCounter++;
            }
        }
    }

    var transMats = [].concat.apply([], transformations);

    disabled=false;
    if(transMats.length==0)disabled=true;

    mesh.numInstances=transMats.length/16;

    if(mesh.numInstances==0)
    {
        disabled=true;
        return;
    }

    mesh.setAttribute('instMat',new Float32Array(transMats),16,{"instanced":true});
    mesh.setAttribute('attrTexOffsets',new Float32Array(tcOffsets),2,{"instanced":true});
    mesh.setAttribute('attrTexSize',new Float32Array(tcSize),2,{"instanced":true});
    mesh.setAttribute('attrTexPos',new Float32Array(texPos),2,{"instanced":true});

    createMesh=false;

    if(createTexture) generateTexture();
}

function printChars(fontSize,simulate)
{
    var font=getFont();
    if(!simulate) font.chars={};

    var ctx=font.ctx;

    ctx.font = fontSize+'px '+inFont.get();
    ctx.textAlign = "left";

    var posy=0,i=0;
    var posx=0;
    var lineHeight=fontSize*1.4;
    var result=
        {
            "fits":true
        };

    for(var i=0;i<font.characters.length;i++)
    {
        var chStr=String(font.characters.substring(i,i+1));
        var chWidth=(ctx.measureText(chStr).width);

        if(posx+chWidth>=textureSize)
        {
            posy+=lineHeight+2;
            posx=0;
        }

        if(!simulate)
        {
            font.chars[chStr]=
                {
                    str:chStr,
                    texCoordX:posx/textureSize,
                    texCoordY:posy/textureSize,
                    texCoordWidth:chWidth/textureSize,
                    texCoordHeight:lineHeight/textureSize,
                };

            ctx.fillText(chStr, posx, posy+fontSize);
        }

        posx+=chWidth+12;
    }

    if(posy>textureSize-lineHeight)
    {
        result.fits=false;
    }

    result.spaceLeft=textureSize-posy;

    return result;
}

function generateTexture()
{
    var font=getFont();
    var string=String(str.get());
    if(string==null || string==undefined)string='';
    for(var i=0;i<string.length;i++)
    {
        var ch=string.substring(i,i+1);
        if(font.characters.indexOf(ch)==-1)
        {
            font.characters+=ch;
            createTexture=true;
        }
    }

    var ctx=font.ctx;
    font.canvas.width=font.canvas.height=textureSize;

    if(!font.texture)
        font.texture=CGL.Texture.createFromImage(cgl,font.canvas,
            {
                filter:filter
            });

    font.texture.setSize(textureSize,textureSize);

    ctx.fillStyle = 'transparent';
    ctx.clearRect(0,0,textureSize,textureSize);
    ctx.fillStyle = 'rgba(255,255,255,255)';

    var fontSize=font.fontSize+40;
    var simu=printChars(fontSize,true);

    while(!simu.fits)
    {
        fontSize-=5;
        simu=printChars(fontSize,true);
    }

    printChars(fontSize,false);

    ctx.restore();

    font.texture.initTexture(font.canvas,filter);
    font.texture.unpackAlpha=true;
    textureOut.set(font.texture);

    font.lastChange=CABLES.now();

    createMesh=true;
    createTexture=false;
}


};

Ops.Gl.Meshes.TextMesh_v2.prototype = new CABLES.Op();
CABLES.OPS["2390f6b3-2122-412e-8c8d-5c2f574e8bd1"]={f:Ops.Gl.Meshes.TextMesh_v2,objName:"Ops.Gl.Meshes.TextMesh_v2"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.Plasma
// 
// **************************************************************

Ops.Gl.TextureEffects.Plasma = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={plasma_frag:"#define PI 3.1415926535897932384626433832795\n\nUNI float time;\nUNI float w;\nUNI float h;\nUNI float mul;\nUNI float amount;\nUNI sampler2D tex;\nUNI float offsetX;\nUNI float offsetY;\n\nIN vec2 texCoord;\n\n{{CGL.BLENDMODES}}\n\nvoid main() {\n   vec2 size=vec2(w,h);\n    float v = 0.0;\n    vec2 c = texCoord * size - size/2.0;\n\n    c.x+=offsetX;\n    c.y+=offsetY;\n\n    v += sin((c.x+time));\n    v += sin((c.y+time)/2.0);\n    v += sin((c.x+c.y+time)/2.0);\n    c += size/2.0 * vec2(sin(time/3.0), cos(time/2.0));\n\n    v += sin(sqrt(c.x*c.x+c.y*c.y+1.0)+time);\n    v = v/2.0;\n\n    vec3 newColor = vec3(sin(PI*v*mul/4.0), sin(PI*v*mul), cos(PI*v*mul))*.5 + .5;\n    vec4 base=texture(tex,texCoord);\n\n    #ifndef GREY\n       vec4 col=vec4( _blend(base.rgb,newColor) ,1.0);\n    #endif\n    #ifdef GREY\n    // .endl()+'       vec4 col=vec4( _blend(base.rgb,vec3((newColor.r+newColor.g+newColor.b)/3.0)) ,1.0);'\n           vec4 col=vec4( _blend(base.rgb,vec3(newColor.g)) ,1.0);\n    #endif\n\n    outColor=cgl_blend(base,col,amount);\n\n}",};
const
    render=op.inTrigger('render'),
    blendMode=CGL.TextureEffect.AddBlendSelect(op,"Blend Mode","normal"),
    amount=op.inValueSlider("Amount",1),
    x=op.inValue("Width",20),
    y=op.inValue("Height",20),
    mul=op.inValue("Mul",1),
    offsetX=op.inValue("offset X",0),
    offsetY=op.inValue("offset Y",0),
    time=op.inValue("Time",1),
    greyscale=op.inValueBool("Greyscale",true),
    trigger=op.outTrigger('trigger');


const cgl=op.patch.cgl;
const shader=new CGL.Shader(cgl);

shader.setSource(shader.getDefaultVertexShader(),attachments.plasma_frag);
shader.define('GREY');

const
    uniX=new CGL.Uniform(shader,'f','w',x),
    uniY=new CGL.Uniform(shader,'f','h',y),
    uniTime=new CGL.Uniform(shader,'f','time',time),
    uniMul=new CGL.Uniform(shader,'f','mul',mul),
    unioffsetX=new CGL.Uniform(shader,'f','offsetX',offsetX),
    unioffsetY=new CGL.Uniform(shader,'f','offsetY',offsetY),
    textureUniform=new CGL.Uniform(shader,'t','tex',0),
    amountUniform=new CGL.Uniform(shader,'f','amount',amount);

greyscale.onChange=function()
{
    if(greyscale.get())shader.define('GREY');
        else shader.removeDefine('GREY');
};

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

Ops.Gl.TextureEffects.Plasma.prototype = new CABLES.Op();
CABLES.OPS["6c82c11d-1931-43b1-8e6c-5d20cb1a0d87"]={f:Ops.Gl.TextureEffects.Plasma,objName:"Ops.Gl.TextureEffects.Plasma"};




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
// Ops.Gl.TextureEffects.Color
// 
// **************************************************************

Ops.Gl.TextureEffects.Color = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={color_frag:"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI float r;\nUNI float g;\nUNI float b;\nUNI float amount;\n\n#ifdef MASK\n    UNI sampler2D mask;\n#endif\n\n{{CGL.BLENDMODES}}\n\nvoid main()\n{\n    vec4 col=vec4(r,g,b,1.0);\n    vec4 base=texture(tex,texCoord);\n\n    float am=amount;\n    #ifdef MASK\n        float msk=texture(mask,texCoord).r;\n        #ifdef INVERTMASK\n            msk=1.0-msk;\n        #endif\n        am*=1.0-msk;\n    #endif\n\n    outColor= cgl_blend(base,col,am);\n    outColor.a*=base.a;\n\n}\n",};
const
    render=op.inTrigger("render"),
    blendMode=CGL.TextureEffect.AddBlendSelect(op,"Blend Mode","normal"),
    amount=op.inValueSlider("Amount",1),
    inMask=op.inTexture("Mask"),
    inMaskInvert=op.inValueBool("Mask Invert"),
    r=op.inValueSlider("r",Math.random()),
    g=op.inValueSlider("g",Math.random()),
    b=op.inValueSlider("b",Math.random()),
    trigger=op.outTrigger("trigger");

r.setUiAttribs({colorPick:true});

op.setPortGroup('Color',[r,g,b]);

const TEX_SLOT=0;
const cgl=op.patch.cgl;
const shader=new CGL.Shader(cgl,'textureeffect color');

var srcFrag=attachments.color_frag||'';

shader.setSource(shader.getDefaultVertexShader(),srcFrag);

const
    textureUniform=new CGL.Uniform(shader,'t','tex',TEX_SLOT),
    makstextureUniform=new CGL.Uniform(shader,'t','mask',1),
    uniformR=new CGL.Uniform(shader,'f','r',r),
    uniformG=new CGL.Uniform(shader,'f','g',g),
    uniformB=new CGL.Uniform(shader,'f','b',b),
    uniformAmount=new CGL.Uniform(shader,'f','amount',amount);

inMask.onChange=function()
{
    if(inMask.get())shader.define("MASK");
        else shader.removeDefine("MASK");
};

inMaskInvert.onChange=function()
{
    if(inMaskInvert.get())shader.define("INVERTMASK");
        else shader.removeDefine("INVERTMASK");
};


CGL.TextureEffect.setupBlending(op,shader,blendMode,amount);

render.onTriggered=function()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(TEX_SLOT, cgl.currentTextureEffect.getCurrentSourceTexture().tex );
    if(inMask.get()) cgl.setTexture(1, inMask.get().tex );

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.TextureEffects.Color.prototype = new CABLES.Op();
CABLES.OPS["c0acfc80-16f9-4f17-978d-bad650f3ed1c"]={f:Ops.Gl.TextureEffects.Color,objName:"Ops.Gl.TextureEffects.Color"};




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


window.addEventListener('load', function(event) {
CABLES.jsLoaded=new Event('CABLES.jsLoaded');
document.dispatchEvent(CABLES.jsLoaded);
});
