# 资源来源与公开边界

## 机构标识与图片

2026-09-10 从用户指定的 JNIST 官网提取，仅用于本院成果门户：

| 本地资源 | 原始地址 |
| --- | --- |
| `public/images/jnist-logo.png` | https://www.jnist.cn/uploadfile/images/20211020/1634691341481093.png |
| `public/images/jnist-campus.webp` | https://www.jnist.cn/uploadfile/images/20211109/1636420879527278.png |
| `public/images/hec-preview.png` | 本项目 HEC Explorer 的实际浏览器截图 |
| `public/images/hec-preview-en.png` | 2026-09-11 从本项目英文 HEC Explorer 生成的浏览器截图 |

院徽与园区摄影不属于 HEC Explorer 的 MIT 许可范围。正式部署前由机构维护者确认使用授权。
园区照片转换为 WebP 以减小体积，没有改变场景内容。

## 页脚备案信息

2026-09-11 按 https://www.jnist.cn/ 页脚同步：

- ICP 备案：鲁ICP备2020050080号，链接 https://beian.miit.gov.cn/ 。
- 公安备案：鲁公网安备 37011202001894号，链接 http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=37011202001894 。

以上是官网公开信息的展示同步，不代表已核验新部署域名的备案覆盖范围。
正式发布前，维护者须确认实际使用域名适用上述备案；GitHub Pages 等其他域名不可直接假定适用。

## HEC 数据

- 原始资料：用户提供的 `temp/Release code/Frontend/`。
- `public/data/hec/v1.0/dataset.csv` 保留原文件字节；SHA-256 记录在 manifest。
- 671 份 CIF 和 671 份 relaxed-supercell 文件直接复制，不改写结构。
- `indexes.json` 从三份原始 JavaScript 索引机械提取；文献标题来自原始 OpenAlex 查询结果，未在线补造。
- 保留 `CODE-LICENSE.txt` 的 MIT 声明。它是代码许可，不能据此推定数据授权。
- 原始论文说明为 submitted，未提供作者列表、正式 DOI 与明确的数据许可。
- `temp/`、原始 release 压缩包和 Analysis notebook 不进入发布产物。

## 迁移边界

保留按同一位点匹配元素、化学式显示的四位小数处理以及原始记录索引。
CSV 解析改用 Papa Parse，并在原始算法外增加格式校验、HTML 转义、分页和全量匹配导出。
原始数据中的 `X` 保留显示但不进入元素筛选，与旧版排除非元素符号的行为一致。

记录数与文件数是本地发布包的校验结果，并非新增科学结论。
