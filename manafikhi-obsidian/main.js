"use strict";

const obsidian = require("obsidian");

class ManafikhiLinkerPlugin extends obsidian.Plugin {
  async onload() {
    console.log("Loading Manafikhi Linker Plugin");

    this.registerEvent(
      this.app.workspace.on("canvas:node-menu", (menu, node) => {
        // Only show for text nodes
        if (node.unknownData.type !== "text") return;

        menu.addItem((item) => {
          item
            .setTitle("Go to Person File")
            .setIcon("user")
            .onClick(async () => {
              await this.handleNodeAction(node);
            });
        });
      })
    );
  }

  async handleNodeAction(node) {
    const data = node.unknownData;
    let filePath = data.file;

    if (!filePath) {
      // Generate unique path using Node ID
      const nodeId = node.id;
      const nodeText = (data.text || "").split("\n")[0].trim() || "Unknown";
      filePath = `people/${nodeId}.md`;

      // 1. Create the file if it doesn't exist
      let file = this.app.vault.getAbstractFileByPath(filePath);
      if (!file) {
        // Create directory if missing
        const folder = this.app.vault.getAbstractFileByPath("people");
        if (!folder) {
          await this.app.vault.createFolder("people");
        }

        const content = `---
name: ${nodeText}
birth_date: 
gender: 
images: 
---

# ${nodeText}

`;
        file = await this.app.vault.create(filePath, content);
      }

      // 2. Update the Canvas node data to include the file link
      // Using node.canvas.setData is safer as it handles the full JSON structure
      const canvasData = node.canvas.getData();
      const nodeInData = canvasData.nodes.find(n => n.id === node.id);
      if (nodeInData) {
        nodeInData.file = filePath;
        node.canvas.setData(canvasData);
        node.canvas.requestSave();
      }
    }

    // 3. Open the file
    const fileToOpen = this.app.vault.getAbstractFileByPath(filePath);
    if (fileToOpen instanceof obsidian.TFile) {
      const leaf = this.app.workspace.getLeaf(false);
      await leaf.openFile(fileToOpen);
    } else {
      new obsidian.Notice("Could not find or create file: " + filePath);
    }
  }

  onunload() {
    console.log("Unloading Manafikhi Linker Plugin");
  }
}

module.exports = ManafikhiLinkerPlugin;
