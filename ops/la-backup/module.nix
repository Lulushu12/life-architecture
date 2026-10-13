# NixOS module for the backup receiver (chess plan item 14).
#
#   imports = [ /path/to/life-architecture/ops/la-backup/module.nix ];
#   services.la-backup = {
#     enable = true;
#     tokenFile = "/etc/la-backup.token";   # root-only file holding the token
#   };
#
# Copies land in /var/lib/la-backup/<app>/. The service listens on
# 127.0.0.1 only; `tailscale serve` puts HTTPS in front of it (see README.md).
{ config, lib, pkgs, ... }:

let
  cfg = config.services.la-backup;
in
{
  options.services.la-backup = {
    enable = lib.mkEnableOption "the receiver for Life Architecture app backups";

    port = lib.mkOption {
      type = lib.types.port;
      default = 8787;
      description = "Port to listen on.";
    };

    host = lib.mkOption {
      type = lib.types.str;
      default = "127.0.0.1";
      description = "Address to listen on. Keep it local and let `tailscale serve` expose it.";
    };

    tokenFile = lib.mkOption {
      type = lib.types.path;
      description = "File holding the shared token (at least 16 characters). Kept out of the Nix store.";
    };
  };

  config = lib.mkIf cfg.enable {
    systemd.services.la-backup = {
      description = "Life Architecture backup receiver";
      wantedBy = [ "multi-user.target" ];
      after = [ "network.target" ];
      serviceConfig = {
        ExecStart = lib.concatStringsSep " " [
          "${pkgs.python3}/bin/python3"
          "${./server.py}"
          "--host ${cfg.host}"
          "--port ${toString cfg.port}"
          "--data-dir /var/lib/la-backup"
          "--token-file %d/token"
        ];
        # The token reaches the service as a credential, readable only by it.
        LoadCredential = "token:${toString cfg.tokenFile}";
        DynamicUser = true;
        StateDirectory = "la-backup";
        UMask = "0077";
        Restart = "on-failure";

        # Hardening: the service only needs its state directory and a socket.
        ProtectSystem = "strict";
        ProtectHome = true;
        PrivateTmp = true;
        PrivateDevices = true;
        NoNewPrivileges = true;
        ProtectKernelTunables = true;
        ProtectKernelModules = true;
        ProtectKernelLogs = true;
        ProtectControlGroups = true;
        ProtectClock = true;
        ProtectHostname = true;
        RestrictAddressFamilies = [ "AF_INET" "AF_INET6" ];
        RestrictNamespaces = true;
        RestrictRealtime = true;
        RestrictSUIDSGID = true;
        LockPersonality = true;
        MemoryDenyWriteExecute = true;
        SystemCallArchitectures = "native";
        CapabilityBoundingSet = "";
      };
    };
  };
}
