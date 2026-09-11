---
title: 高熵陶瓷数据库
englishTitle: High-Entropy Ceramics Database
summary: 面向原子尺度模拟与数据驱动设计的高熵陶瓷数据资源，汇集标准化组分、晶体原型、结构文件与来源文献。
year: 2026
status: 预览版
version: "1.0"
tags: [材料科学, 数据集, 在线工具]
image: images/hec-preview.png
imageAlt: 高熵陶瓷数据库的元素周期表筛选界面
tool: hec
datasetPath: data/hec/v1.0/dataset.csv
datasetArchivePath: data/hec/hec-v1.0.zip
manifestPath: data/hec/v1.0/manifest.json
citation: >-
  High-Entropy Ceramics Database for Atomic-scale Simulation and Data-driven Design.
  Submitted to Computational Materials Science. Dataset version 1.0.
licenseNote: 原始 Explorer 代码采用 MIT License。数据与结构文件未单独声明许可证，使用及再分发前请向成果作者确认。来源论文版权归各权利人所有。
en:
  summary: A high-entropy ceramics resource for atomic-scale simulation and data-driven design, bringing together standardized compositions, crystal prototypes, structure files and source publications.
  status: Preview
  tags: [Materials science, Dataset, Online tool]
  image: images/hec-preview-en.png
  imageAlt: Periodic table filtering interface of the High-Entropy Ceramics Database
  licenseNote: The original Explorer code is released under the MIT License. No separate license is stated for the data or structure files; contact the authors before use or redistribution. Source publications remain the copyright of their respective rights holders.
---

## 面向高熵陶瓷的可追溯数据资源

本数据库将文献中的高熵陶瓷组分整理为按晶格位点组织的 JSON 化学式，
关联晶体原型、来源 DOI、无序占位 CIF 和 CHGNet 弛豫超胞，
为原子尺度模拟与数据驱动材料设计提供可检索的数据入口。

本页接入提供的 Frontend v1.0 数据包。配套论文
*High-Entropy Ceramics Database for Atomic-scale Simulation and Data-driven Design*
在原始发布说明中标记为已投稿至 *Computational Materials Science*；
作者列表、正式发表信息和论文 DOI 尚未在该说明中提供。

## 数据字段

| 字段 | 含义 |
| --- | --- |
| `Sorted Json formula` | 按 A、B 等晶格位点组织的元素及占位比例；`X` 是原始数据中的占位标记，不参与元素筛选 |
| `prototype` / `prototype_name` | 晶体原型及其名称，沿用原始数据标注 |
| `prototype_formula` | 位点的化学计量系数，用于生成可读化学式 |
| `DOIs` | 来源论文链接；部分文献标题来自原始 OpenAlex 查询结果 |
| `record_id` | 筛选导出时附加的原始记录编号，从 1 开始，翻页与筛选不会重新编号 |

## 筛选语义与适用范围

选择一个元素时，匹配任意位点包含该元素的记录；选择多个元素时，
要求它们**同时出现在同一个晶格位点**。例如首条 AlB2 原型记录中，
Hf 与 Ti 同属 A 位点，可以共同匹配；Hf 与 B 分属不同位点，不会共同匹配。
这与原始 Explorer 的筛选算法一致，不等于“整个化学式包含全部所选元素”。
