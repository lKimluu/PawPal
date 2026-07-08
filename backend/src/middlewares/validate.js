export function validate(schema, target = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[target])

    if (!result.success) {
      return res.status(400).json({
        message: result.error.issues[0]?.message || '請求資料格式錯誤',
      })
    }

    if (target === 'query') {
      req.validated_query = result.data
      return next()
    }

    req[target] = result.data
    return next()
  }
}
