# Systemd timers en el EC2 de Bukka

## bukka-cron.timer + bukka-cron.service

Ejecuta `POST /api/cron/daily` en producción todos los días a las 08:00 UTC.
El endpoint dispara:

- Notificación admin `SUBSCRIPTION_RENEWAL_REMINDER` + email `renewal-reminder`
  a usuarios cuya suscripción expira dentro de 3 días (±12 h).
- Notificación admin `SUBSCRIPTION_EXPIRED` + email `expired` a usuarios con
  `subscriptionEnd < now`; limpia `subscriptionPlanId` y `subscriptionEnd`
  para que sea idempotente.

El endpoint se protege con el header `X-Cron-Secret`. El secret se lee de
`/etc/bukka/production.env` (`CRON_SECRET=...`).

## Instalación en el EC2 (una sola vez)

```bash
# 1) Generar un secret en local y ponerlo en /etc/bukka/production.env
openssl rand -hex 32

# 2) Como ubuntu en el EC2, añadir al production.env:
sudo sh -c 'echo "CRON_SECRET=<secret>" >> /etc/bukka/production.env'

# 3) Copiar los archivos systemd al servidor (desde local):
scp -i ~/.ssh/bukka-key.pem ops/systemd/bukka-cron.* ubuntu@3.219.117.180:/tmp/
ssh -i ~/.ssh/bukka-key.pem ubuntu@3.219.117.180 '
  sudo mv /tmp/bukka-cron.service /etc/systemd/system/
  sudo mv /tmp/bukka-cron.timer   /etc/systemd/system/
  sudo systemctl daemon-reload
  sudo systemctl enable --now bukka-cron.timer
'

# 4) (Opcional) Ejecutar una vez manualmente para validar
ssh -i ~/.ssh/bukka-key.pem ubuntu@3.219.117.180 'sudo systemctl start bukka-cron.service'
ssh -i ~/.ssh/bukka-key.pem ubuntu@3.219.117.180 'sudo journalctl -u bukka-cron.service --no-pager -n 20'
```

## Diagnóstico

```bash
# Ver próximos disparos
sudo systemctl list-timers bukka-cron.timer

# Ver logs del último disparo
sudo journalctl -u bukka-cron.service --no-pager -n 50

# Desactivar temporalmente
sudo systemctl stop bukka-cron.timer
sudo systemctl disable bukka-cron.timer
```
