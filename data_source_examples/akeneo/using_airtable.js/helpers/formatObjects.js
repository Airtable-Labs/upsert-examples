const productItemToAirtableFields = (akeneoItem) => {
  return {
    fields: {
      uuid: akeneoItem.uuid,
      sku: akeneoItem.identifier,
      enabled: akeneoItem.enabled,
      categories: akeneoItem.categories,
      family: akeneoItem.family,
      'name-en_US': akeneoItem.values.name.filter(n => n.locale === 'en_US')[0].data,
      _has_attributes: Object.keys(akeneoItem.values),
      _json: JSON.stringify(akeneoItem, null, 2)
    }
  }
}

const categoryItemToAirtableFields = (akeneoItem) => {
  return {
    fields: {
      code: akeneoItem.code,
      'label-en_US': akeneoItem.labels.en_US,
      _json: JSON.stringify(akeneoItem, null, 2)
    }
  }
}

const familyItemToAirtableFields = (akeneoItem) => {
  return {
    fields: {
      code: akeneoItem.code,
      'label-en_US': akeneoItem.labels.en_US,
      attribute_as_label: akeneoItem.attribute_as_label,
      attribute_as_image: akeneoItem.attribute_as_image,
      attributes: akeneoItem.attributes,
      marketplaces: akeneoItem.marketplaces,
      _json: JSON.stringify(akeneoItem, null, 2)
    }
  }
}

const attributeItemToAirtableFields = (akeneoItem) => {
  return {
    fields: {
      code: akeneoItem.code,
      'label-en_US': akeneoItem.labels.en_US,
      type: akeneoItem.type,
      _json: JSON.stringify(akeneoItem, null, 2)
    }
  }
}

module.exports = {
  productItemToAirtableFields,
  categoryItemToAirtableFields,
  familyItemToAirtableFields,
  attributeItemToAirtableFields
}
