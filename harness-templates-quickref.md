# Templates quick reference

See [README.md](./README.md) for Herdr / Pi / together framing.

```
skills/create-herdr-plugin.md    Herdr plugins
skills/create-pi-extension.md    Pi extensions & packages
harness/templates/herdr-plugin/  blank Herdr plugin
harness/templates/pi-package/    blank Pi package
packages/ep-starter/             /setup, /scaffold, /agents
examples/                        working samples
```

```bash
# Herdr plugin
cp -r harness/templates/herdr-plugin/ my-plugin
cd my-plugin && herdr plugin link .

# Pi capability (agent researches + tests + builds it)
/scaffold viralbuilder   # asks: service? outcome? env var name?
```
