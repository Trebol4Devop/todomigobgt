# TODOMIGOBGT: Plataforma Civica Unificada y Sistema de Alertas Ciudadanas de Guatemala

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Git Flow](https://img.shields.io/badge/git--flow-formal-green.svg)](CONTRIBUTING.md#2-modelo-de-ramas-git-flow-formal)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![SemVer](https://img.shields.io/badge/SemVer-2.0.0-brightgreen.svg)](https://semver.org)

---

## 1. Resumen Ejecutivo

TODOMIGOBGT es una solucion tecnologica de gobernanza digital y codigo abierto disenada para centralizar, sintetizar y democratizar el acceso a la informacion publica oficial, tramites y convocatorias ciudadanas de la Republica de Guatemala.

El sistema aborda la fragmentacion y complejidad tecnica del ecosistema de portales gubernamentales tradicionales, el cual frecuentemente dificulta el acceso oportuno de la ciudadania a convocatorias sociales, alertas tempranas de emergencia, servicios de salud y programas de educacion, con especial enfasis en la inclusion de comunidades mayahablantes mediante soporte bilingue en idioma K'iche'.

La arquitectura implementa un modelo de procesamiento desacoplado de alta disponibilidad y bajo coste operacional:
1. **Frontend en el Edge:** Publicado sobre la red perimetral de Cloudflare (Workers y Pages) con almacenamiento de objetos distribuido (R2).
2. **Pipeline Inteligente ETL:** Extraccion modular de fuentes oficiales y procesamiento de lenguaje natural asistido por IA (DeepSeek).
3. **Backend Perimetral de Notificaciones:** Sistema ligero en hardware embebido (Raspberry Pi 4) o servidores virtuales, expuesto mediante tunel cifrado (Tailscale Funnel) con persistencia transaccional SQLite WAL y envio transaccional SMTP.

---

## 2. Arquitectura Global del Sistema

```drawio
<mxfile>
  <diagram id="5H7xal5TjyC4Jxt32jfu" name="Page-1">
    <mxGraphModel dx="2" dy="1" grid="0" gridSize="10" guides="1" tooltips="0" connect="0" arrows="0" fold="0" page="0" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">
      <root>
        <mxCell id="7x4GQJiHkeUQjHa_GcVb-0" />
        <mxCell id="7x4GQJiHkeUQjHa_GcVb-1" parent="7x4GQJiHkeUQjHa_GcVb-0" />
        <UserObject label="" mermaidData="{&#xa;  &quot;data&quot;: &quot;flowchart TD\n    subgraph FuentesExternas [\&quot;Fuentes Externas y Servicios Cloud\&quot;]\n        Gob[\&quot;Portales Gubernamentales: AGN, MSPAS, MINGOB, etc.\&quot;]\n        DeepSeekAPI[\&quot;DeepSeek Cloud AI API\&quot;]\n        GoogleSMTP[\&quot;Servidor SMTP Google\&quot;]\n    end\n\n    subgraph EdgeCloudflare [\&quot;Capa Edge Global: Cloudflare\&quot;]\n        CF_Worker[\&quot;Cloudflare Worker y Pages\&quot;]\n        CF_R2[(\&quot;Bucket Cloudflare R2: noticias.json\&quot;)]\n    end\n\n    subgraph CapaRed [\&quot;Tunel Seguro Ingress\&quot;]\n        TailscaleFunnel[\&quot;Tailscale Funnel HTTPS\&quot;]\n    end\n\n    subgraph ServidorEdge [\&quot;Host Edge: Servidor / Raspberry Pi 4\&quot;]\n        subgraph PipelineContenedor [\&quot;News Pipeline Docker Cron\&quot;]\n            ScraperEngine[\&quot;Motor de Extraccion Web\&quot;]\n            Deduplicador[\&quot;Deduplicador y Validador\&quot;]\n            R2Publisher[\&quot;Publicador S3 SDK\&quot;]\n        end\n\n        subgraph BackendNotificaciones [\&quot;Backend API y Despacho Python\&quot;]\n            APIRest[\&quot;Servidor REST HTTP server.py\&quot;]\n            Dispatcher[\&quot;Despachador de Noticias\&quot;]\n            MailerWorker[\&quot;Worker Asincrono de Correo\&quot;]\n            DBLocal[(\&quot;Base de Datos SQLite todomigobgt.db\&quot;)]\n        end\n    end\n\n    subgraph DispositivosClientes [\&quot;Clientes Ciudadanos\&quot;]\n        Navegador[\&quot;Ciudadano: Navegador Web / Movil\&quot;]\n        BandejaCorreo[\&quot;Ciudadano: Correo Electronico\&quot;]\n    end\n\n    Gob --&gt; ScraperEngine\n    ScraperEngine --&gt; Deduplicador\n    Deduplicador --&gt; DeepSeekAPI\n    DeepSeekAPI --&gt; Deduplicador\n    Deduplicador --&gt; R2Publisher\n    R2Publisher --&gt; CF_R2\n\n    Navegador --&gt; CF_Worker\n    CF_Worker --&gt; CF_R2\n    CF_R2 --&gt; Navegador\n\n    Navegador --&gt; TailscaleFunnel\n    TailscaleFunnel --&gt; APIRest\n    APIRest &lt;--&gt; DBLocal\n    APIRest --&gt; CF_R2\n    APIRest --&gt; MailerWorker\n    Dispatcher --&gt; MailerWorker\n    MailerWorker --&gt; GoogleSMTP\n    GoogleSMTP --&gt; BandejaCorreo&quot;,&#xa;  &quot;config&quot;: null&#xa;}" id="3ZBlLwIxySNtSUg7YmHG-0">
          <mxCell connectable="0" parent="7x4GQJiHkeUQjHa_GcVb-1" style="group;transparentBounds=1;editIcon=1;lockedGroup=0;groupPadding=10;" vertex="1">
            <mxGeometry as="geometry" />
          </mxCell>
        </UserObject>
        <UserObject label="Fuentes Externas y Servicios Cloud" mermaidId="n:FuentesExternas" mermaidBaseStyle="html=1;whiteSpace=wrap;strokeWidth=1;verticalAlign=top;fillColor=light-dark(#ffffde,#1f2020);strokeColor=light-dark(#aaaa33,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" mermaidBaseValue="Fuentes Externas y Servicios Cloud" id="7x4GQJiHkeUQjHa_GcVb-2">
          <mxCell parent="3ZBlLwIxySNtSUg7YmHG-0" style="html=1;whiteSpace=wrap;strokeWidth=1;verticalAlign=top;fillColor=light-dark(#ffffde,#1f2020);strokeColor=light-dark(#aaaa33,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" vertex="1">
            <mxGeometry height="1336" width="520" x="10" as="geometry" />
          </mxCell>
        </UserObject>
        <UserObject label="Portales Gubernamentales: AGN, MSPAS, MINGOB, etc." mermaidId="n:Gob" mermaidBaseStyle="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" mermaidBaseValue="Portales Gubernamentales: AGN, MSPAS, MINGOB, etc." id="7x4GQJiHkeUQjHa_GcVb-3">
          <mxCell parent="7x4GQJiHkeUQjHa_GcVb-2" style="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" vertex="1">
            <mxGeometry height="54" width="450" x="35" y="45" as="geometry" />
          </mxCell>
        </UserObject>
        <UserObject label="DeepSeek Cloud AI API" mermaidId="n:DeepSeekAPI" mermaidBaseStyle="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" mermaidBaseValue="DeepSeek Cloud AI API" id="7x4GQJiHkeUQjHa_GcVb-4">
          <mxCell parent="7x4GQJiHkeUQjHa_GcVb-2" style="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" vertex="1">
            <mxGeometry height="54" width="219" x="151" y="407" as="geometry" />
          </mxCell>
        </UserObject>
        <UserObject label="Servidor SMTP Google" mermaidId="n:GoogleSMTP" mermaidBaseStyle="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" mermaidBaseValue="Servidor SMTP Google" id="7x4GQJiHkeUQjHa_GcVb-5">
          <mxCell parent="7x4GQJiHkeUQjHa_GcVb-2" style="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" vertex="1">
            <mxGeometry height="54" width="215" x="153" y="1257" as="geometry" />
          </mxCell>
        </UserObject>
        <UserObject label="Capa Edge Global: Cloudflare" mermaidId="n:EdgeCloudflare" mermaidBaseStyle="html=1;whiteSpace=wrap;strokeWidth=1;verticalAlign=top;fillColor=light-dark(#ffffde,#1f2020);strokeColor=light-dark(#aaaa33,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" mermaidBaseValue="Capa Edge Global: Cloudflare" id="7x4GQJiHkeUQjHa_GcVb-6">
          <mxCell parent="3ZBlLwIxySNtSUg7YmHG-0" style="html=1;whiteSpace=wrap;strokeWidth=1;verticalAlign=top;fillColor=light-dark(#ffffde,#1f2020);strokeColor=light-dark(#aaaa33,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" vertex="1">
            <mxGeometry height="395" width="338" x="1599" y="526" as="geometry" />
          </mxCell>
        </UserObject>
        <UserObject label="Cloudflare Worker y Pages" mermaidId="n:CF_Worker" mermaidBaseStyle="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" mermaidBaseValue="Cloudflare Worker y Pages" id="7x4GQJiHkeUQjHa_GcVb-7">
          <mxCell parent="7x4GQJiHkeUQjHa_GcVb-6" style="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" vertex="1">
            <mxGeometry height="54" width="247" x="49" y="316" as="geometry" />
          </mxCell>
        </UserObject>
        <UserObject label="Bucket Cloudflare R2: noticias.json" mermaidId="n:CF_R2" mermaidBaseStyle="html=1;shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=10;strokeWidth=1;whiteSpace=wrap;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" mermaidBaseValue="Bucket Cloudflare R2: noticias.json" id="7x4GQJiHkeUQjHa_GcVb-8">
          <mxCell parent="7x4GQJiHkeUQjHa_GcVb-6" style="html=1;shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=10;strokeWidth=1;whiteSpace=wrap;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" vertex="1">
            <mxGeometry height="67" width="268" x="35" y="45" as="geometry" />
          </mxCell>
        </UserObject>
        <UserObject label="" mermaidId="e:CF_Worker-&gt;CF_R2#0" mermaidBaseStyle="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=0.5;exitY=0;entryX=0.51;entryY=1;" mermaidBaseValue="" id="7x4GQJiHkeUQjHa_GcVb-35">
          <mxCell edge="1" parent="7x4GQJiHkeUQjHa_GcVb-6" source="7x4GQJiHkeUQjHa_GcVb-7" style="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=0.5;exitY=0;entryX=0.51;entryY=1;" target="7x4GQJiHkeUQjHa_GcVb-8">
            <mxGeometry relative="1" as="geometry">
              <Array as="points">
                <mxPoint x="172" y="291" />
                <mxPoint x="172" y="266" />
                <mxPoint x="172" y="214" />
                <mxPoint x="172" y="162" />
                <mxPoint x="172" y="137" />
              </Array>
            </mxGeometry>
          </mxCell>
        </UserObject>
        <UserObject label="Tunel Seguro Ingress" mermaidId="n:CapaRed" mermaidBaseStyle="html=1;whiteSpace=wrap;strokeWidth=1;verticalAlign=top;fillColor=light-dark(#ffffde,#1f2020);strokeColor=light-dark(#aaaa33,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" mermaidBaseValue="Tunel Seguro Ingress" id="7x4GQJiHkeUQjHa_GcVb-9">
          <mxCell parent="3ZBlLwIxySNtSUg7YmHG-0" style="html=1;whiteSpace=wrap;strokeWidth=1;verticalAlign=top;fillColor=light-dark(#ffffde,#1f2020);strokeColor=light-dark(#aaaa33,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" vertex="1">
            <mxGeometry height="124" width="295" x="550" y="797" as="geometry" />
          </mxCell>
        </UserObject>
        <UserObject label="Tailscale Funnel HTTPS" mermaidId="n:TailscaleFunnel" mermaidBaseStyle="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" mermaidBaseValue="Tailscale Funnel HTTPS" id="7x4GQJiHkeUQjHa_GcVb-10">
          <mxCell parent="7x4GQJiHkeUQjHa_GcVb-9" style="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" vertex="1">
            <mxGeometry height="54" width="225" x="35" y="45" as="geometry" />
          </mxCell>
        </UserObject>
        <UserObject label="Host Edge: Servidor / Raspberry Pi 4" mermaidId="n:ServidorEdge" mermaidBaseStyle="html=1;whiteSpace=wrap;strokeWidth=1;verticalAlign=top;fillColor=light-dark(#ffffde,#1f2020);strokeColor=light-dark(#aaaa33,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" mermaidBaseValue="Host Edge: Servidor / Raspberry Pi 4" id="7x4GQJiHkeUQjHa_GcVb-11">
          <mxCell parent="3ZBlLwIxySNtSUg7YmHG-0" style="html=1;whiteSpace=wrap;strokeWidth=1;verticalAlign=top;fillColor=light-dark(#ffffde,#1f2020);strokeColor=light-dark(#aaaa33,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" vertex="1">
            <mxGeometry height="1098" width="733" x="850" y="119" as="geometry" />
          </mxCell>
        </UserObject>
        <UserObject label="News Pipeline Docker Cron" mermaidId="n:PipelineContenedor" mermaidBaseStyle="html=1;whiteSpace=wrap;strokeWidth=1;verticalAlign=top;fillColor=light-dark(#ffffde,#1f2020);strokeColor=light-dark(#aaaa33,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" mermaidBaseValue="News Pipeline Docker Cron" id="7x4GQJiHkeUQjHa_GcVb-12">
          <mxCell parent="7x4GQJiHkeUQjHa_GcVb-11" style="html=1;whiteSpace=wrap;strokeWidth=1;verticalAlign=top;fillColor=light-dark(#ffffde,#1f2020);strokeColor=light-dark(#aaaa33,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" vertex="1">
            <mxGeometry height="332" width="309" x="203" y="45" as="geometry" />
          </mxCell>
        </UserObject>
        <UserObject label="Motor de Extraccion Web" mermaidId="n:ScraperEngine" mermaidBaseStyle="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" mermaidBaseValue="Motor de Extraccion Web" id="7x4GQJiHkeUQjHa_GcVb-13">
          <mxCell parent="7x4GQJiHkeUQjHa_GcVb-12" style="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" vertex="1">
            <mxGeometry height="54" width="239" x="35" y="45" as="geometry" />
          </mxCell>
        </UserObject>
        <UserObject label="Deduplicador y Validador" mermaidId="n:Deduplicador" mermaidBaseStyle="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" mermaidBaseValue="Deduplicador y Validador" id="7x4GQJiHkeUQjHa_GcVb-14">
          <mxCell parent="7x4GQJiHkeUQjHa_GcVb-12" style="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" vertex="1">
            <mxGeometry height="54" width="239" x="35" y="149" as="geometry" />
          </mxCell>
        </UserObject>
        <UserObject label="Publicador S3 SDK" mermaidId="n:R2Publisher" mermaidBaseStyle="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" mermaidBaseValue="Publicador S3 SDK" id="7x4GQJiHkeUQjHa_GcVb-15">
          <mxCell parent="7x4GQJiHkeUQjHa_GcVb-12" style="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" vertex="1">
            <mxGeometry height="54" width="188" x="80" y="253" as="geometry" />
          </mxCell>
        </UserObject>
        <UserObject label="" mermaidId="e:ScraperEngine-&gt;Deduplicador#0" mermaidBaseStyle="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=1;exitY=1;entryX=1;entryY=1;" mermaidBaseValue="" id="7x4GQJiHkeUQjHa_GcVb-36">
          <mxCell edge="1" parent="7x4GQJiHkeUQjHa_GcVb-12" source="7x4GQJiHkeUQjHa_GcVb-13" style="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=1;exitY=1;entryX=1;entryY=1;" target="7x4GQJiHkeUQjHa_GcVb-14">
            <mxGeometry relative="1" as="geometry">
              <Array as="points" />
            </mxGeometry>
          </mxCell>
        </UserObject>
        <UserObject label="" mermaidId="e:Deduplicador-&gt;R2Publisher#0" mermaidBaseStyle="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=1;exitY=1;entryX=1;entryY=1;" mermaidBaseValue="" id="7x4GQJiHkeUQjHa_GcVb-37">
          <mxCell edge="1" parent="7x4GQJiHkeUQjHa_GcVb-12" source="7x4GQJiHkeUQjHa_GcVb-14" style="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=1;exitY=1;entryX=1;entryY=1;" target="7x4GQJiHkeUQjHa_GcVb-15">
            <mxGeometry relative="1" as="geometry">
              <Array as="points">
                <mxPoint x="1022" y="325" />
              </Array>
            </mxGeometry>
          </mxCell>
        </UserObject>
        <UserObject label="Backend API y Despacho Python" mermaidId="n:BackendNotificaciones" mermaidBaseStyle="html=1;whiteSpace=wrap;strokeWidth=1;verticalAlign=top;fillColor=light-dark(#ffffde,#1f2020);strokeColor=light-dark(#aaaa33,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" mermaidBaseValue="Backend API y Despacho Python" id="7x4GQJiHkeUQjHa_GcVb-16">
          <mxCell parent="7x4GQJiHkeUQjHa_GcVb-11" style="html=1;whiteSpace=wrap;strokeWidth=1;verticalAlign=top;fillColor=light-dark(#ffffde,#1f2020);strokeColor=light-dark(#aaaa33,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" vertex="1">
            <mxGeometry height="241" width="663" x="35" y="832" as="geometry" />
          </mxCell>
        </UserObject>
        <UserObject label="Servidor REST HTTP server.py" mermaidId="n:APIRest" mermaidBaseStyle="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" mermaidBaseValue="Servidor REST HTTP server.py" id="7x4GQJiHkeUQjHa_GcVb-17">
          <mxCell parent="7x4GQJiHkeUQjHa_GcVb-16" style="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" vertex="1">
            <mxGeometry height="54" width="270" x="42" y="45" as="geometry" />
          </mxCell>
        </UserObject>
        <UserObject label="Despachador de Noticias" mermaidId="n:Dispatcher" mermaidBaseStyle="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" mermaidBaseValue="Despachador de Noticias" id="7x4GQJiHkeUQjHa_GcVb-18">
          <mxCell parent="7x4GQJiHkeUQjHa_GcVb-16" style="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" vertex="1">
            <mxGeometry height="54" width="235" x="392" y="45" as="geometry" />
          </mxCell>
        </UserObject>
        <UserObject label="Worker Asincrono de Correo" mermaidId="n:MailerWorker" mermaidBaseStyle="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" mermaidBaseValue="Worker Asincrono de Correo" id="7x4GQJiHkeUQjHa_GcVb-19">
          <mxCell parent="7x4GQJiHkeUQjHa_GcVb-16" style="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" vertex="1">
            <mxGeometry height="54" width="259" x="369" y="156" as="geometry" />
          </mxCell>
        </UserObject>
        <UserObject label="Base de Datos SQLite todomigobgt.db" mermaidId="n:DBLocal" mermaidBaseStyle="html=1;shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=10;strokeWidth=1;whiteSpace=wrap;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" mermaidBaseValue="Base de Datos SQLite todomigobgt.db" id="7x4GQJiHkeUQjHa_GcVb-20">
          <mxCell parent="7x4GQJiHkeUQjHa_GcVb-16" style="html=1;shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=10;strokeWidth=1;whiteSpace=wrap;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" vertex="1">
            <mxGeometry height="67" width="284" x="35" y="149" as="geometry" />
          </mxCell>
        </UserObject>
        <UserObject label="" mermaidId="e:APIRest-&gt;DBLocal#0" mermaidBaseStyle="curved=1;startArrow=block;startSize=7;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=1;exitY=1;entryX=1;entryY=1;" mermaidBaseValue="" id="7x4GQJiHkeUQjHa_GcVb-38">
          <mxCell edge="1" parent="7x4GQJiHkeUQjHa_GcVb-16" source="7x4GQJiHkeUQjHa_GcVb-17" style="curved=1;startArrow=block;startSize=7;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=1;exitY=1;entryX=1;entryY=1;" target="7x4GQJiHkeUQjHa_GcVb-20">
            <mxGeometry relative="1" as="geometry">
              <Array as="points" />
            </mxGeometry>
          </mxCell>
        </UserObject>
        <UserObject label="" mermaidId="e:APIRest-&gt;MailerWorker#0" mermaidBaseStyle="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=1;exitY=1;entryX=1;entryY=1;" mermaidBaseValue="" id="7x4GQJiHkeUQjHa_GcVb-39">
          <mxCell edge="1" parent="7x4GQJiHkeUQjHa_GcVb-16" source="7x4GQJiHkeUQjHa_GcVb-17" style="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=1;exitY=1;entryX=1;entryY=1;" target="7x4GQJiHkeUQjHa_GcVb-19">
            <mxGeometry relative="1" as="geometry">
              <Array as="points">
                <mxPoint x="1196" y="221" />
              </Array>
            </mxGeometry>
          </mxCell>
        </UserObject>
        <UserObject label="" mermaidId="e:Dispatcher-&gt;MailerWorker#0" mermaidBaseStyle="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=1;exitY=1;entryX=1;entryY=1;" mermaidBaseValue="" id="7x4GQJiHkeUQjHa_GcVb-40">
          <mxCell edge="1" parent="7x4GQJiHkeUQjHa_GcVb-16" source="7x4GQJiHkeUQjHa_GcVb-18" style="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=1;exitY=1;entryX=1;entryY=1;" target="7x4GQJiHkeUQjHa_GcVb-19">
            <mxGeometry relative="1" as="geometry">
              <Array as="points">
                <mxPoint x="1357" y="221" />
              </Array>
            </mxGeometry>
          </mxCell>
        </UserObject>
        <UserObject label="Clientes Ciudadanos" mermaidId="n:DispositivosClientes" mermaidBaseStyle="html=1;whiteSpace=wrap;strokeWidth=1;verticalAlign=top;fillColor=light-dark(#ffffde,#1f2020);strokeColor=light-dark(#aaaa33,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" mermaidBaseValue="Clientes Ciudadanos" id="7x4GQJiHkeUQjHa_GcVb-21">
          <mxCell parent="3ZBlLwIxySNtSUg7YmHG-0" style="html=1;whiteSpace=wrap;strokeWidth=1;verticalAlign=top;fillColor=light-dark(#ffffde,#1f2020);strokeColor=light-dark(#aaaa33,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" vertex="1">
            <mxGeometry height="807" width="381" x="1960" y="668" as="geometry" />
          </mxCell>
        </UserObject>
        <UserObject label="Ciudadano: Navegador Web / Movil" mermaidId="n:Navegador" mermaidBaseStyle="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" mermaidBaseValue="Ciudadano: Navegador Web / Movil" id="7x4GQJiHkeUQjHa_GcVb-22">
          <mxCell parent="7x4GQJiHkeUQjHa_GcVb-21" style="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" vertex="1">
            <mxGeometry height="54" width="311" x="35" y="45" as="geometry" />
          </mxCell>
        </UserObject>
        <UserObject label="Ciudadano: Correo Electronico" mermaidId="n:BandejaCorreo" mermaidBaseStyle="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" mermaidBaseValue="Ciudadano: Correo Electronico" id="7x4GQJiHkeUQjHa_GcVb-23">
          <mxCell parent="7x4GQJiHkeUQjHa_GcVb-21" style="html=1;whiteSpace=wrap;strokeWidth=1;fillColor=light-dark(#ECECFF,#1f2020);strokeColor=light-dark(#9370DB,#cccccc);fontColor=light-dark(#333333,#cccccc);fontFamily=Trebuchet MS,Verdana,Arial,sans-serif;fontSize=16;" vertex="1">
            <mxGeometry height="54" width="279" x="51" y="728" as="geometry" />
          </mxCell>
        </UserObject>
        <UserObject label="" mermaidId="e:Gob-&gt;ScraperEngine#0" mermaidBaseStyle="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=0.5;exitY=1;entryX=1;entryY=1;" mermaidBaseValue="" id="7x4GQJiHkeUQjHa_GcVb-24">
          <mxCell edge="1" parent="3ZBlLwIxySNtSUg7YmHG-0" source="7x4GQJiHkeUQjHa_GcVb-3" style="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=0.5;exitY=1;entryX=1;entryY=1;" target="7x4GQJiHkeUQjHa_GcVb-13">
            <mxGeometry relative="1" as="geometry">
              <Array as="points">
                <mxPoint x="270" y="134" />
                <mxPoint x="270" y="159" />
                <mxPoint x="270" y="184" />
              </Array>
            </mxGeometry>
          </mxCell>
        </UserObject>
        <UserObject label="" mermaidId="e:Deduplicador-&gt;DeepSeekAPI#0" mermaidBaseStyle="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=0;exitY=0.6111111111111112;entryX=1;entryY=0.6111111111111112;curved=1;exitX=1;exitY=1;entryX=1;entryY=0.61;" mermaidBaseValue="" id="7x4GQJiHkeUQjHa_GcVb-25">
          <mxCell edge="1" parent="3ZBlLwIxySNtSUg7YmHG-0" source="7x4GQJiHkeUQjHa_GcVb-14" style="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=1;exitY=1;entryX=1;entryY=0.61;" target="7x4GQJiHkeUQjHa_GcVb-4">
            <mxGeometry relative="1" as="geometry">
              <mxPoint as="offset" />
              <Array as="points">
                <mxPoint x="734" y="404" />
              </Array>
            </mxGeometry>
          </mxCell>
        </UserObject>
        <UserObject label="" mermaidId="e:DeepSeekAPI-&gt;Deduplicador#0" mermaidBaseStyle="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=1;exitY=0.3888888888888889;entryX=0;entryY=0.3888888888888889;curved=1;exitX=1;exitY=0.39;entryX=1;entryY=1;" mermaidBaseValue="" id="7x4GQJiHkeUQjHa_GcVb-26">
          <mxCell edge="1" parent="3ZBlLwIxySNtSUg7YmHG-0" source="7x4GQJiHkeUQjHa_GcVb-4" style="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=1;exitY=0.39;entryX=1;entryY=1;" target="7x4GQJiHkeUQjHa_GcVb-14">
            <mxGeometry relative="1" as="geometry">
              <mxPoint as="offset" />
              <Array as="points">
                <mxPoint x="734" y="380" />
              </Array>
            </mxGeometry>
          </mxCell>
        </UserObject>
        <UserObject label="" mermaidId="e:R2Publisher-&gt;CF_R2#0" mermaidBaseStyle="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=1;exitY=1;entryX=0;entryY=0.28;" mermaidBaseValue="" id="7x4GQJiHkeUQjHa_GcVb-27">
          <mxCell edge="1" parent="3ZBlLwIxySNtSUg7YmHG-0" source="7x4GQJiHkeUQjHa_GcVb-15" style="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=1;exitY=1;entryX=0;entryY=0.28;" target="7x4GQJiHkeUQjHa_GcVb-8">
            <mxGeometry relative="1" as="geometry">
              <Array as="points">
                <mxPoint x="1227" y="496" />
                <mxPoint x="1227" y="521" />
                <mxPoint x="1227" y="546" />
              </Array>
            </mxGeometry>
          </mxCell>
        </UserObject>
        <UserObject label="" mermaidId="e:Navegador-&gt;CF_Worker#0" mermaidBaseStyle="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=0.64;exitY=1;entryX=1;entryY=0.24;" mermaidBaseValue="" id="7x4GQJiHkeUQjHa_GcVb-28">
          <mxCell edge="1" parent="3ZBlLwIxySNtSUg7YmHG-0" source="7x4GQJiHkeUQjHa_GcVb-22" style="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=0.64;exitY=1;entryX=1;entryY=0.24;" target="7x4GQJiHkeUQjHa_GcVb-7">
            <mxGeometry relative="1" as="geometry">
              <Array as="points">
                <mxPoint x="2236" y="792" />
                <mxPoint x="2236" y="817" />
              </Array>
            </mxGeometry>
          </mxCell>
        </UserObject>
        <UserObject label="" mermaidId="e:CF_R2-&gt;Navegador#0" mermaidBaseStyle="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=0.69;exitY=1;entryX=0.01;entryY=0;" mermaidBaseValue="" id="7x4GQJiHkeUQjHa_GcVb-29">
          <mxCell edge="1" parent="3ZBlLwIxySNtSUg7YmHG-0" source="7x4GQJiHkeUQjHa_GcVb-8" style="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=0.69;exitY=1;entryX=0.01;entryY=0;" target="7x4GQJiHkeUQjHa_GcVb-22">
            <mxGeometry relative="1" as="geometry">
              <Array as="points">
                <mxPoint x="1856" y="663" />
                <mxPoint x="1856" y="688" />
              </Array>
            </mxGeometry>
          </mxCell>
        </UserObject>
        <UserObject label="" mermaidId="e:Navegador-&gt;TailscaleFunnel#0" mermaidBaseStyle="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=0.36;exitY=1;entryX=1;entryY=0.43;" mermaidBaseValue="" id="7x4GQJiHkeUQjHa_GcVb-30">
          <mxCell edge="1" parent="3ZBlLwIxySNtSUg7YmHG-0" source="7x4GQJiHkeUQjHa_GcVb-22" style="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=0.36;exitY=1;entryX=1;entryY=0.43;" target="7x4GQJiHkeUQjHa_GcVb-10">
            <mxGeometry relative="1" as="geometry">
              <Array as="points">
                <mxPoint x="2065" y="792" />
                <mxPoint x="2065" y="817" />
              </Array>
            </mxGeometry>
          </mxCell>
        </UserObject>
        <UserObject label="" mermaidId="e:TailscaleFunnel-&gt;APIRest#0" mermaidBaseStyle="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=0.5;exitY=1;entryX=1;entryY=1;" mermaidBaseValue="" id="7x4GQJiHkeUQjHa_GcVb-31">
          <mxCell edge="1" parent="3ZBlLwIxySNtSUg7YmHG-0" source="7x4GQJiHkeUQjHa_GcVb-10" style="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=0.5;exitY=1;entryX=1;entryY=1;" target="7x4GQJiHkeUQjHa_GcVb-17">
            <mxGeometry relative="1" as="geometry">
              <Array as="points">
                <mxPoint x="698" y="921" />
                <mxPoint x="984" y="946" />
                <mxPoint x="984" y="971" />
              </Array>
            </mxGeometry>
          </mxCell>
        </UserObject>
        <UserObject label="" mermaidId="e:APIRest-&gt;CF_R2#0" mermaidBaseStyle="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=1;exitY=1;entryX=0.17;entryY=1;" mermaidBaseValue="" id="7x4GQJiHkeUQjHa_GcVb-32">
          <mxCell edge="1" parent="3ZBlLwIxySNtSUg7YmHG-0" source="7x4GQJiHkeUQjHa_GcVb-17" style="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=1;exitY=1;entryX=0.17;entryY=1;" target="7x4GQJiHkeUQjHa_GcVb-8">
            <mxGeometry relative="1" as="geometry">
              <Array as="points">
                <mxPoint x="1299" y="971" />
                <mxPoint x="1299" y="946" />
                <mxPoint x="1613" y="921" />
                <mxPoint x="1613" y="869" />
                <mxPoint x="1613" y="817" />
                <mxPoint x="1613" y="792" />
                <mxPoint x="1613" y="740" />
                <mxPoint x="1613" y="688" />
                <mxPoint x="1613" y="663" />
              </Array>
            </mxGeometry>
          </mxCell>
        </UserObject>
        <UserObject label="" mermaidId="e:MailerWorker-&gt;GoogleSMTP#0" mermaidBaseStyle="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=1;exitY=1;entryX=0.5;entryY=0;" mermaidBaseValue="" id="7x4GQJiHkeUQjHa_GcVb-33">
          <mxCell edge="1" parent="3ZBlLwIxySNtSUg7YmHG-0" source="7x4GQJiHkeUQjHa_GcVb-19" style="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=1;exitY=1;entryX=0.5;entryY=0;" target="7x4GQJiHkeUQjHa_GcVb-5">
            <mxGeometry relative="1" as="geometry">
              <Array as="points">
                <mxPoint x="1384" y="1192" />
                <mxPoint x="1384" y="1217" />
                <mxPoint x="270" y="1242" />
              </Array>
            </mxGeometry>
          </mxCell>
        </UserObject>
        <UserObject label="" mermaidId="e:GoogleSMTP-&gt;BandejaCorreo#0" mermaidBaseStyle="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=0.5;exitY=1;entryX=0.5;entryY=0;" mermaidBaseValue="" id="7x4GQJiHkeUQjHa_GcVb-34">
          <mxCell edge="1" parent="3ZBlLwIxySNtSUg7YmHG-0" source="7x4GQJiHkeUQjHa_GcVb-5" style="curved=1;startArrow=none;endArrow=block;endSize=7;strokeColor=light-dark(#333333,#cccccc);exitX=0.5;exitY=1;entryX=0.5;entryY=0;" target="7x4GQJiHkeUQjHa_GcVb-23">
            <mxGeometry relative="1" as="geometry">
              <Array as="points">
                <mxPoint x="270" y="1346" />
                <mxPoint x="2151" y="1371" />
              </Array>
            </mxGeometry>
          </mxCell>
        </UserObject>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>

```
---

## 3. Componentes del Repositorio

El proyecto esta organizado bajo una arquitectura monorepositorio que separa responsabilidades operacionales:

| Modulo / Directorio | Tecnologia | Proposito |
| :--- | :--- | :--- |
| `todo-mi-gob-gt/` | Astro 5, Tailwind CSS, TypeScript | Portal web ciudadano, responsive, bilingue (Español / K'iche'), accesible (WCAG 2.1 AA) y ejecutable en Cloudflare Workers. |
| `news-pipeline/` | Node.js 20, TypeScript, Vitest, Docker | Pipeline ETL para scraping de portales gubernamentales, filtrado y traduccion con IA (DeepSeek) y publicacion S3 a Cloudflare R2. |
| `raspberry-pi/` | Python 3.12, SQLite WAL, SMTP | Backend REST nativo para suscripciones ciudadanas, base de datos de usuarios y despacho de correos en segundo plano. |
| `.github/workflows/` | GitHub Actions, Docker Buildx | Automatizacion de integracion continua y publicacion de imagenes multi-arquitectura (ARM64 / AMD64). |

---

## 4. Control de Versiones y Metodologia de Desarrollo

El proyecto opera bajo estandares rigurosos de ingenieria de software y gestion de versiones para codigo abierto:

### 4.1 Git Flow Formal

* **`main`**: Rama de produccion estricta. Todo commit en `main` representa una version estable y debe estar acompanado de una etiqueta de version semantica (`vX.Y.Z`).
* **`develop`**: Rama de integracion para consolidacion de funcionalidades previas a liberacion.
* **`feature/<nombre>`**: Ramas temporales para desarrollo de nuevas capacidades. Se ramifican de `develop` y se fusionan mediante Pull Request a `develop`.
* **`refactor/<nombre>`**: Ramas destinadas a reestructuracion y mejoras internas sin cambios funcionales.
* **`hotfix/<nombre>`**: Ramas para mitigacion de incidentes criticos en produccion, ramificadas desde `main` y reintegradas a `main` y `develop`.

Para mas detalles del flujo, consulta la [Guia de Contribucion](CONTRIBUTING.md).

### 4.2 Conventional Commits 1.0.0

Los mensajes de confirmacion deben seguir la especificacion formal:
* `feat`: Nuevas funcionalidades del sistema.
* `fix`: Correcciones de defectos.
* `refactor`: Refactorizaciones de codigo sin impacto funcional.
* `docs`: Modificaciones en documentacion tecnica.
* `test`: Adicion o refactorizacion de pruebas unitarias/integracion.
* `chore`: Mantenimiento de dependencias y configuracion.

### 4.3 Versionado Semantico (SemVer 2.0.0)

El versionado de la plataforma sigue el esquema `MAJOR.MINOR.PATCH`:
* **MAJOR**: Cambios arquitecturales o roturas de compatibilidad en la API/modelo de datos.
* **MINOR**: Incorporacion de nuevas fuentes de datos o capacidades funcionales compatibles hacia atras.
* **PATCH**: Parches de seguridad, optimizaciones de rendimiento y correcciones menores.

---

## 5. Instalacion y Despliegue

### 5.1 Requisitos Previos

* Node.js 20 LTS o superior
* Gestor de paquetes `pnpm` (`npm install -g pnpm`)
* Python 3.10 o superior
* Docker Engine y Docker Compose
* Cuenta y credenciales de Cloudflare (Workers y R2)
* Cuenta de API DeepSeek
* Cuenta Tailscale (para despliegue perimetral seguro)

### 5.2 Clonacion del Repositorio

```bash
git clone https://github.com/Trebol4Devop/todomigobgt.git
cd todomigobgt
```

### 5.3 Modulo 1: Frontend (`todo-mi-gob-gt`)

1. **Instalacion de dependencias:**
   ```bash
   cd todo-mi-gob-gt
   pnpm install
   ```

2. **Configuracion de entorno (`.env`):**
   ```ini
   PUBLIC_API_URL=https://tu-nodo-tailscale.ts.net
   ```

3. **Compilacion local y prueba:**
   ```bash
   pnpm run dev
   ```

4. **Despliegue en Cloudflare Workers:**
   ```bash
   npx wrangler login
   pnpm run build
   npx wrangler deploy
   ```

### 5.4 Modulo 2: Pipeline de Noticias (`news-pipeline`)

1. **Configuracion de variables (`.env`):**
   ```ini
   NODE_ENV=production
   LOG_LEVEL=info
   DEEPSEEK_API_KEY=tu_api_key
   DEEPSEEK_BASE_URL=https://api.deepseek.com
   DEEPSEEK_MODEL=deepseek-chat
   R2_ACCOUNT_ID=tu_account_id
   R2_ACCESS_KEY_ID=tu_access_key
   R2_SECRET_ACCESS_KEY=tu_secret_key
   R2_BUCKET_NAME=todomigobgt
   R2_OBJECT_KEY=noticias.json
   SCRAPER_MAX_CANDIDATES=30
   SCRAPER_TIMEOUT_MS=15000
   SCRAPER_DELAY_MS=1000
   DRY_RUN=false
   OUTPUT_PREVIEW_PATH=./output/noticias.preview.json
   ```

2. **Ejecucion de pruebas automatizadas:**
   ```bash
   cd news-pipeline
   pnpm install
   pnpm test
   ```

3. **Ejecucion en contenedor Docker:**
   ```bash
   docker build -t todomigobgt-news-pipeline .
   docker run --rm --env-file .env -v $(pwd)/output:/app/output todomigobgt-news-pipeline
   ```

### 5.5 Modulo 3: Backend de Suscripciones y Notificaciones (`raspberry-pi`)

1. **Configuracion de variables (`.env`):**
   ```ini
   HOST=0.0.0.0
   PORT=8080
   DB_PATH=/app/data/todomigobgt.db
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=tu_correo@gmail.com
   SMTP_PASS=tu_contrasena_de_aplicacion
   SMTP_APP_NAME=todomigobgt
   SENDER_NAME=TODOMIGOBGT Alertas Ciudadanas
   R2_NOTICIAS_URL=https://pub-b246f9594b0f4cb5960b8f6ec9f1ba2b.r2.dev/noticias.json
   ```

2. **Ejecucion de pruebas de base de datos y mensajeria:**
   ```bash
   cd raspberry-pi
   python test_database.py
   python test_mailer.py
   ```

3. **Ejecucion mediante Docker Compose:**
   ```bash
   docker compose up -d --build
   ```

4. **Publicacion segura mediante Tailscale Funnel:**
   ```bash
   sudo tailscale up
   sudo tailscale funnel 8080
   tailscale funnel status
   ```

---

## 6. Especificacion de API REST

El backend expone los siguientes endpoints REST:

### `GET /api/health`
Retorna el estado de disponibilidad del servicio y conexion a la base de datos.
* **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "status": "ok",
    "service": "todomigobgt-raspi",
    "db": "todomigobgt.db"
  }
  ```

### `GET /api/categories`
Lista el catalogo oficial de categorias tematicas de alertas.
* **Respuesta exitosa (`200 OK`):**
  ```json
  [
    { "id": "education_scholarships", "name": "Educacion y Becas" },
    { "id": "health_wellbeing", "name": "Salud y Prevencion" },
    { "id": "social_programs", "name": "Apoyo Social" },
    { "id": "procedures_services", "name": "Tramites y Documentos" },
    { "id": "security_alerts", "name": "Alertas y Emergencias" },
    { "id": "employment_development", "name": "Empleo y Emprendimiento" }
  ]
  ```

### `POST /api/users`
Registra un nuevo ciudadano o actualiza sus categorias suscritas.
* **Cuerpo de la solicitud:**
  ```json
  {
    "name": "Maria Alvarez",
    "email": "maria@ejemplo.gt",
    "preferences": ["health_wellbeing", "education_scholarships"],
    "allow_update": true
  }
  ```
* **Respuesta exitosa (`201 Created`):**
  ```json
  {
    "id": 1,
    "name": "Maria Alvarez",
    "email": "maria@ejemplo.gt",
    "is_new": true,
    "preferences": ["health_wellbeing", "education_scholarships"]
  }
  ```

### `POST /api/news/dispatch`
Recibe un lote de noticias procesadas y despacha las alertas a los usuarios suscritos en segundo plano.

---

## 7. Documentacion Adicional

* [Guia Completa de Despliegue e Infraestructura](GUIA_DESPLIEGUE.md)
* [Guia de Contribucion y Git Flow](CONTRIBUTING.md)
* [Codigo de Conducta](CODE_OF_CONDUCT.md)
* [Politica de Seguridad](SECURITY.md)
* [Registro Historico de Versiones](CHANGELOG.md)

---

## 8. Licencia

Este proyecto esta licenciado bajo los terminos de la [Licencia MIT](LICENSE). Toda persona u organizacion es libre de utilizar, estudiar, modificar y distribuir esta solucion con fines publicos o privados con la debida atribucion.
