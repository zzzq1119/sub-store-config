const { type, name } = $arguments
const compatible_outbound = {
  tag: 'COMPATIBLE',
  type: 'direct',
}

// 定义一个 *仅用于 urltest 组* 的排除规则。
// 它包含了通用关键字以及所有与香港(HK)、台湾(TW)相关的变种名称。
const exclude_for_urltest_regex = /官网|无法|套餐|剩余|港|hk|hongkong|hong kong|🇭🇰|台|tw|taiwan|🇹🇼/i

let compatible
let config = JSON.parse($files[0])
let all_proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
})

// 1. 创建一个专门为 urltest 过滤后的代理列表
// 这个列表排除了所有匹配上述规则的节点
const filtered_for_urltest_proxies = all_proxies.filter(p => !exclude_for_urltest_regex.test(p.tag))

// 2. 将 *所有* 原始代理节点都添加到配置文件的 outbounds 列表中
// 这样做可以确保所有节点都存在于配置中，即使它们没被 urltest 组使用
config.outbounds.push(...all_proxies)

// 3. 遍历配置文件中的出站策略组，并按不同规则添加代理
config.outbounds.map(outbound => {
  // 规则 A: 为 'Proxy' 组添加 *所有* 未经过滤的代理
  if (outbound.tag === 'Proxy') {
    outbound.outbounds.push(...getTags(all_proxies))
  }

  // 规则 B: 为 'urltest' 组添加 *经过严格过滤* 的代理
  if (outbound.tag === 'urltest') {
    outbound.outbounds.push(...getTags(filtered_for_urltest_proxies))
  }
})

// 4. 为可能变空的策略组添加一个默认的 "COMPATIBLE" 出站，防止 sing-box 启动失败
config.outbounds.forEach(outbound => {
  if (Array.isArray(outbound.outbounds) && outbound.outbounds.length === 0) {
    if (!compatible) {
      config.outbounds.push(compatible_outbound)
      compatible = true
    }
    outbound.outbounds.push(compatible_outbound.tag);
  }
});

// 5. 生成最终的配置文件内容
$content = JSON.stringify(config, null, 2)

// 辅助函数：从代理对象数组中提取出它们的 tag (名称) 列表
function getTags(proxies) {
  return proxies.map(p => p.tag)
}
