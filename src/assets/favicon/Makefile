.PHONY: all

all:
	@mkdir -p generated
	@node ../../../node_modules/cli-real-favicon/real-favicon.js generate config.json generated.json generated
	@for F in generated/*.png; do nix run nixpkgs#optipng -- -o7 -zm1-9 $$F; done

clean:
	@rm -rf generated generated.json
