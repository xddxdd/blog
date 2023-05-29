{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    flake-utils-plus = {
      url = "github:gytis-ivaskevicius/flake-utils-plus";
      inputs.flake-utils.follows = "flake-utils";
    };
  };

  outputs = {
    self,
    flake-utils,
    flake-utils-plus,
    ...
  } @ inputs:
    flake-utils-plus.lib.mkFlake {
      inherit self inputs;
      supportedSystems = flake-utils.lib.allSystems;
      outputsBuilder = channels: let
        pkgs = channels.nixpkgs;
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            imagemagick
            jpegoptim
            nodejs
            optipng
            parallel
          ];
        };

        formatter = pkgs.alejandra;
      };
    };
}
