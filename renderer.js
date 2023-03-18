const { ipcRenderer } = require('electron')

const jsonInput = document.getElementById('jsonInput')
const tableBody = document.querySelector('#table tbody')
const getCheckedItemsButton = document.getElementById('getCheckedItems')
const output = document.getElementById('output')
const splunkQueryOutput = document.getElementById('splunkQueryOutput')

function createTableRows(obj, parentKey = '') {
  const rows = []

  for (const [key, value] of Object.entries(obj)) {
    const row = document.createElement('tr')
    const selectCell = document.createElement('td')
    const groupCell = document.createElement('td')
    const keyCell = document.createElement('td')
    const valueCell = document.createElement('td')

    const fullKey = parentKey ? `${parentKey}.${key}` : key
    const formattedKey = fullKey.replace(/^0\./, '').replace(/\.0\./g, '.{}.')

    keyCell.textContent = formattedKey

    const selectCheckbox = document.createElement('input')
    selectCheckbox.type = 'checkbox'
    selectCell.appendChild(selectCheckbox)

    const groupCheckbox = document.createElement('input')
    groupCheckbox.type = 'checkbox'
    groupCell.appendChild(groupCheckbox)

    if (typeof value === 'object' && value !== null) {
      rows.push(...createTableRows(value, fullKey))
    } else {
      valueCell.textContent = value
      row.appendChild(selectCell)
      row.appendChild(groupCell)
      row.appendChild(keyCell)
      row.appendChild(valueCell)
      rows.push(row)
    }
  }

  return rows
}

jsonInput.addEventListener('change', () => {
  const json = jsonInput.value

  try {
    const obj = JSON.parse(json)
    tableBody.innerHTML = ''

    const firstInnerObjectKey = Object.keys(obj)[0]
    const firstInnerObject = obj[firstInnerObjectKey]

    const rows = createTableRows(firstInnerObject)
    rows.forEach(row => tableBody.appendChild(row))
  } catch (error) {
    console.error(error)
  }
})

getCheckedItemsButton.addEventListener('click', () => {
  const selectedItems = []
  const groupedItems = []
  const rows = tableBody.querySelectorAll('tr')

  rows.forEach((row, index) => {
    const isSelected = row.cells[0].querySelector('input[type="checkbox"]').checked
    const isGrouped = row.cells[1].querySelector('input[type="checkbox"]').checked
    const key = row.cells[2].textContent
    const value = row.cells[3].textContent

    if (isSelected) {
      if (isGrouped) {
        groupedItems.push({ key, value })
      } else {
        selectedItems.push({ key, value })
      }
    }
  })

  output.value = JSON.stringify([...selectedItems, ...groupedItems], null, 2)

  // Generate Splunk query
  const queryParts = ['index="*" sourcetype="*"']
  const groupedQueryParts = []

  selectedItems.forEach(({ key, value }) => {
    queryParts.push(`${key}="${value}"`)
  })

  if (groupedItems.length > 0) {
    const groupedOrQuery = groupedItems.map(({ key, value }) => `${key}="${value}"`).join(' OR ')
    queryParts.push(`(${groupedOrQuery})`)
  }

  const splunkQuery = queryParts.join(' AND ')
  splunkQueryOutput.value = splunkQuery
})
