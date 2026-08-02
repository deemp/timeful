{
  description = "Timeful development shell";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/0c2094806c9e542f31785ef3569ab9e900e3ce9c";
    systems.url = "github:nix-systems/default/future-26.11";
    flake-parts = {
      url = "github:hercules-ci/flake-parts/17c9d6cdfc60c64f4ee8d306f9bc0b4ccb51481e";
      inputs.nixpkgs-lib.url = "github:nix-community/nixpkgs.lib";
    };
  };

  outputs = inputs@{ flake-parts, systems, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = import systems;

      perSystem = { pkgs, ... }: {
        devShells.default = pkgs.mkShell {
          packages = [ pkgs.python3 ];
        };
      };
    };
}
