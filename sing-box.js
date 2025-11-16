const { type, name } = $arguments
const compatible_outbound = {
  tag: 'COMPATIBLE',
  type: 'direct',
}

// 定义需要排除的关键字的正则表达式
const exclude_regex = /官网|无法|香港|套餐|剩余|台湾/i

let compatible
let config = JSON.parse($files[0])
let proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
})

// 1. 根据关键字过滤掉不需要的代理
proxies = proxies.filter(p => !exclude_regex.test(p.tag))

// 2. 将过滤后的代理节点添加到配置文件的 outbounds 列表中
config.outbounds.push(...proxies)

// 3. 遍历配置文件中的出站策略组，并向 Proxy 和 urltest 组添加所有代理
config.outbounds.map(outbound => {
  if (['Proxy', 'urltest'].includes(outbound.tag)) {
    // 将所有过滤后代理的 tag 添加到这两个组的 outbounds 数组中
    outbound.outbounds.push(...getTags(proxies))
  }
})

// 4. 为空的策略组添加一个默认的 "COMPATIBLE" 出站，防止 sing-box 启动失败
config.outbounds.forEach(outbound => {
  if (Array.isArray(outbound.outbounds) && outbound.outbounds.length === 0) {
    if (!compatible) {
      config.outbounds.push(compatible_outbound)
      compatible = true
    }
    outbound.outbounds.push(compatible_outbound.tag);
  }
});

$content = JSON.stringify(config, null, 2)

// 辅助函数：从代理对象数组中提取 tag 字符串数组
function getTags(proxies) {
  // 因为不再需要按地区过滤，可以简化此函数，但保留原样也完全没问题
  return proxies.map(p => p.tag)
}
