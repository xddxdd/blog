.PHONY: all
all:
	@node_modules/hexo/bin/hexo generate 2>&1 | tee hexo.log

clean:
	@node_modules/hexo/bin/hexo clean

serve:
	@python3 -m http.server --directory public/
