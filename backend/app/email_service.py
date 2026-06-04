"""Envío de correos via Gmail SMTP."""
import os
import smtplib
import ssl
from email.message import EmailMessage

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Juan El Mecánico")


def _enviar(to: str, subject: str, html: str, text: str | None = None) -> None:
    if not SMTP_USER or not SMTP_PASSWORD:
        raise RuntimeError(
            "SMTP no configurado. Define SMTP_USER y SMTP_PASSWORD en el .env"
        )

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_USER}>"
    msg["To"] = to
    msg.set_content(text or "Por favor abre este correo en un cliente que soporte HTML.")
    msg.add_alternative(html, subtype="html")

    contexto = ssl.create_default_context()
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=contexto, timeout=20) as s:
        s.login(SMTP_USER, SMTP_PASSWORD)
        s.send_message(msg)


def _plantilla(titulo: str, intro: str, codigo: str, validez_min: int = 10) -> str:
    return f"""
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr><td align="center" style="padding:24px 12px;">
      <table width="520" cellspacing="0" cellpadding="0" border="0" style="background:white;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px -8px rgba(11,31,79,0.18);max-width:100%;">
        <tr><td style="background:linear-gradient(135deg,#0B1F4F 0%,#1A47B8 50%,#3B6FE0 100%);padding:28px;text-align:center;color:white;">
          <div style="font-size:14px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.7);">Juan El Mecánico</div>
          <div style="font-size:24px;font-weight:800;margin-top:6px;">{titulo}</div>
        </td></tr>
        <tr><td style="padding:32px 28px;">
          <p style="margin:0 0 16px;line-height:1.55;color:#334155;">{intro}</p>
          <div style="background:#E8EEFB;border:1px dashed #1A47B8;border-radius:14px;text-align:center;padding:22px;margin:18px 0;">
            <div style="font-size:12px;color:#1A47B8;text-transform:uppercase;letter-spacing:.2em;font-weight:700;">Tu código de verificación</div>
            <div style="font-size:38px;font-weight:800;color:#0B1F4F;letter-spacing:0.4em;margin-top:8px;">{codigo}</div>
          </div>
          <p style="margin:8px 0;font-size:13px;color:#64748b;line-height:1.55;">
            Este código es válido por <strong>{validez_min} minutos</strong>. Si no solicitaste este código, ignora este correo.
          </p>
        </td></tr>
        <tr><td style="background:#f1f5f9;padding:16px;text-align:center;font-size:12px;color:#64748b;">
          © Juan El Mecánico · Reservas online
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""


def enviar_codigo_registro(to: str, codigo: str) -> None:
    html = _plantilla(
        "Verifica tu correo",
        "Estás a un paso de crear tu cuenta en Juan El Mecánico. Usa el siguiente código para confirmar tu correo electrónico:",
        codigo,
    )
    _enviar(to, "Código para crear tu cuenta — Juan El Mecánico", html)


def enviar_codigo_reset(to: str, codigo: str) -> None:
    html = _plantilla(
        "Recuperar contraseña",
        "Solicitaste restablecer tu contraseña. Usa el siguiente código para continuar:",
        codigo,
    )
    _enviar(to, "Código para recuperar contraseña — Juan El Mecánico", html)
