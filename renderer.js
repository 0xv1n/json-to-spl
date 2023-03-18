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
    const keyCell = document.createElement('td')
    const valueCell = document.createElement('td')

    const fullKey = parentKey ? `${parentKey}.${key}` : key

    // Remove '0.' from the beginning of the key if it exists
    const formattedKey = fullKey.replace(/^0\./, '').replace(/\.0\./g, '.{}.')

    keyCell.textContent = formattedKey

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    selectCell.appendChild(checkbox)

    if (typeof value === 'object' && value !== null) {
      rows.push(...createTableRows(value, fullKey))
    } else {
      valueCell.textContent = value
      row.appendChild(selectCell)
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

    // Get the first inner object
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
  const checkboxes = tableBody.querySelectorAll('input[type="checkbox"]')

  checkboxes.forEach((checkbox, index) => {
    if (checkbox.checked) {
      const row = checkbox.closest('tr')
      const key = row.cells[1].textContent
      const value = row.cells[2].textContent
      selectedItems.push({ key, value })
    }
  })

  output.value = JSON.stringify(selectedItems, null, 2)

  // Generate Splunk query
  const queryParts = ['index="*" sourcetype="*"']
  selectedItems.forEach(({ key, value }) => {
    queryParts.push(`${key}="${value}"`)
  })

  const splunkQuery = queryParts.join(' AND ')
  splunkQueryOutput.value = splunkQuery
})
