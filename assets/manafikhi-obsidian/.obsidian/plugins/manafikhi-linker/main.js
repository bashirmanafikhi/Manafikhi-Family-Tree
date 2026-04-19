"use strict";

const obsidian = require("obsidian");

class ManafikhiLinkerPlugin extends obsidian.Plugin {
  async onload() {
    console.log("Loading Manafikhi Linker Plugin");

    // Add command for bulk sync all nodes
    this.addCommand({
      id: "sync-all-tree-nodes",
      name: "Sync All Tree Nodes to Person Files",
      callback: this.syncAllNodes.bind(this),
    });

    this.registerEvent(
      this.app.workspace.on("canvas:node-menu", (menu, node) => {
        if (node.unknownData.type !== "text") return;

        menu.addItem((item) => {
          item
            .setTitle("Go to Person File")
            .setIcon("user")
            .onClick(async () => {
              await this.handleNodeAction(node);
            });
        });

        menu.addItem((item) => {
          item
            .setTitle("Set Profile Image")
            .setIcon("image")
            .onClick(async () => {
              await this.setProfileImage(node);
            });
        });
      })
    );
  }

  generatePersonContent(data) {
    const firstName = data.first_name || data.name || "";
    const lastName = data.last_name || "";
    const displayName = firstName + (lastName ? " " + lastName : "");

    return `---
first_name: ${firstName}
last_name: ${lastName}
gender: ${data.gender || ""}
birth_date: ${data.birth_date || ""}
death_date: ${data.death_date || ""}
is_dead: ${data.is_dead || "false"}
is_manafikhi: ${data.is_manafikhi || "false"}
profile_image: ${data.profile_image || ""}
images: ${data.images || ""}
---

# ${displayName}

`;
  }

  parsePersonFrontmatter(content) {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return {};

    const data = {};
    const lines = frontmatterMatch[1].split("\n");
    for (const line of lines) {
      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) continue;
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      data[key] = value;
    }
    return data;
  }

  async syncAllNodes() {
    try {
      console.log("Sync All Nodes: Starting...");

      let leaf = this.app.workspace.activeLeaf;
      if (!leaf) {
        leaf = this.app.workspace.getMostRecentLeaf();
      }
      console.log("Active leaf:", leaf);

      if (!leaf || !leaf.view) {
        console.log("No active leaf or view found");
        new obsidian.Notice("Please open a canvas file first");
        return;
      }

      console.log("View type:", leaf.view.constructor.name);

      if (!leaf.view.canvas) {
        new obsidian.Notice("Please open a canvas file first");
        return;
      }

      const canvas = leaf.view.canvas;
      const canvasData = canvas.getData();
      console.log("Canvas data nodes:", canvasData?.nodes?.length);

      if (!canvasData || !canvasData.nodes || canvasData.nodes.length === 0) {
        new obsidian.Notice("No nodes found in canvas");
        return;
      }

      let syncedCount = 0;
      let createdCount = 0;

      let peopleFolder = this.app.vault.getAbstractFileByPath("people");
      if (!peopleFolder) {
        try {
          peopleFolder = await this.app.vault.createFolder("people");
          console.log("Created people folder");
        } catch (err) {
          console.error("Failed to create people folder:", err);
          new obsidian.Notice("Error creating people folder: " + err.message);
          return;
        }
      }

      for (const node of canvasData.nodes) {
        console.log("Processing node:", node.id, "type:", node.type);
        if (node.type !== "text") continue;
        const existingFile = this.app.vault.getAbstractFileByPath(node.file);
        if (node.file && existingFile) {
          console.log("Node already has file:", node.file);
          syncedCount++;
          continue;
        }

        const nodeId = node.id || node.nodeId;
        const nodeText = (node.text || node.text || "").split("\n")[0].trim() || "Unknown";
        console.log("Node:", node.id, "text:", nodeText);

        const filePath = `people/${nodeId}.md`;
        console.log("File path:", filePath);
        let file = this.app.vault.getAbstractFileByPath(filePath);

        if (!file) {
          const content = this.generatePersonContent({ first_name: nodeText });
          file = await this.app.vault.create(filePath, content);
          console.log("Created file:", filePath);
          createdCount++;
        }

        node.file = filePath;
        console.log("Set node.file to:", filePath);
        syncedCount++;
      }

      canvas.setData(canvasData);
      canvas.requestSave();

      console.log("Sync complete:", syncedCount, "nodes,", createdCount, "created");
      new obsidian.Notice(`Synced ${syncedCount} nodes, created ${createdCount} new files`);
    } catch (err) {
      console.error("Sync error:", err);
      new obsidian.Notice("Error syncing nodes: " + err.message);
    }
  }

  async setProfileImage(node) {
    const data = node.unknownData;
    let filePath = data.file;

    if (!filePath) {
      await this.handleNodeAction(node);
      filePath = data.file || node.file;
    }

    if (!filePath) {
      new obsidian.Notice("No file linked to this node");
      return;
    }

    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!file) {
      new obsidian.Notice("Could not find linked file");
      return;
    }

    const content = await this.app.vault.read(file);
    const existingData = this.parsePersonFrontmatter(content);

    const modal = new obsidian.Modal(this.app);
    let selectedImagePath = "";

    modal.contentEl.createEl("h3", { text: "Select Profile Image" });

    const filePicker = modal.contentEl.createEl("input", {
      type: "file",
      accept: "image/*",
    });

    const resultDiv = modal.contentEl.createDiv();
    resultDiv.createEl("p", { text: "Choose an image file, then click Set" });

    const setButton = modal.contentEl.createEl("button", {
      text: "Set as Profile Image",
    });

    filePicker.onchange = async (e) => {
      const imageFile = e.target.files[0];
      if (!imageFile) return;

      const arrayBuffer = await imageFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const imageName = imageFile.name;

      const imagesFolder = this.app.vault.getAbstractFileByPath("people/images");
      if (!imagesFolder) {
        await this.app.vault.createFolder("people/images");
      }

      const destPath = `people/images/${imageName}`;
      await this.app.vault.createBinary(destPath, uint8Array);
      selectedImagePath = destPath;

      resultDiv.innerHTML = `<p style="color:green">Selected: ${imageName}</p>`;
    };

    setButton.onclick = async () => {
      if (!selectedImagePath) {
        new obsidian.Notice("Please select an image first");
        return;
      }

      const newContent = content.replace(
        /^---\n([\s\S]*?)\n---/,
        `---
first_name: ${existingData.first_name || ""}
last_name: ${existingData.last_name || ""}
gender: ${existingData.gender || ""}
birth_date: ${existingData.birth_date || ""}
death_date: ${existingData.death_date || ""}
is_dead: ${existingData.is_dead || "false"}
is_manafikhi: ${existingData.is_manafikhi || "false"}
profile_image: ${selectedImagePath}
images: ${existingData.images || ""}
---`
      );

      await this.app.vault.modify(file, newContent);
      modal.close();
      new obsidian.Notice("Profile image set!");
    };

    modal.open();
  }

  async handleNodeAction(node) {
    const data = node.unknownData;
    let filePath = data.file;

    if (!filePath) {
      const nodeId = node.id;
      const nodeText = (data.text || "").split("\n")[0].trim() || "Unknown";
      filePath = `people/${nodeId}.md`;

      let file = this.app.vault.getAbstractFileByPath(filePath);
      if (!file) {
        const folder = this.app.vault.getAbstractFileByPath("people");
        if (!folder) {
          await this.app.vault.createFolder("people");
        }

        const content = this.generatePersonContent({ first_name: nodeText });
        file = await this.app.vault.create(filePath, content);
      }

      const canvasData = node.canvas.getData();
      const nodeInData = canvasData.nodes.find((n) => n.id === node.id);
      if (nodeInData) {
        nodeInData.file = filePath;
        node.canvas.setData(canvasData);
        node.canvas.requestSave();
      }
    }

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
