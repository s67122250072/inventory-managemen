import logo from './assets/retail-inventory-logo.png'
import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import {
  onValue,
  ref,
  set,
  update,
  remove,
} from 'firebase/database'
import { auth, database } from './config/firebase'
import Login from './Login'
import './App.css'


const menuItems = [
  { id: 'dashboard', label: 'หน้าหลัก', icon: '⌂' },
  { id: 'products', label: 'จัดการสินค้า', icon: '▣' },
  { id: 'categories', label: 'หมวดหมู่สินค้า', icon: '▤' },
  { id: 'stock', label: 'จัดการสต็อก', icon: '⇅' },
  { id: 'search', label: 'ค้นหาสินค้า', icon: '⌕' },
  { id: 'reports', label: 'รายงาน', icon: '▥' },
]

function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [firebaseError, setFirebaseError] = useState('')
  const [activePage, setActivePage] = useState('dashboard')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ทั้งหมด')
  const [showForm, setShowForm] = useState(false)

  const [stockAction, setStockAction] = useState('in')
  const [stockProductId, setStockProductId] = useState('')
  const [stockQuantity, setStockQuantity] = useState('')
  const [stockNote, setStockNote] = useState('')
  const [stockSubmitting, setStockSubmitting] = useState(false)
  const [stockHistory, setStockHistory] = useState([])

  const [form, setForm] = useState({
    name: '',
    category: 'เครื่องดื่ม',
    price: '',
    stock: '',
    unit: 'ชิ้น',
    imageUrl: '',
  })

  // ตรวจสอบสถานะการเข้าสู่ระบบ
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // โหลดข้อมูลสินค้าจาก Firebase
  useEffect(() => {
    if (!user) {
      setProducts([])
      setLoading(false)
      return
    }

    setLoading(true)

    const productsRef = ref(database, 'products')

    const unsubscribe = onValue(
      productsRef,
      (snapshot) => {
        const data = snapshot.val() || {}
        setProducts(Object.values(data))
        setFirebaseError('')
        setLoading(false)
      },
      (error) => {
        console.error('Firebase error:', error)
        setFirebaseError('ไม่สามารถโหลดข้อมูลจาก Firebase ได้')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  // โหลดประวัติการรับเข้าและเบิกออก
  useEffect(() => {
    if (!user) {
      setStockHistory([])
      return
    }

    const historyRef = ref(database, 'stockHistory')

    const unsubscribe = onValue(
      historyRef,
      (snapshot) => {
        const data = snapshot.val() || {}
        const history = Object.values(data).sort(
          (a, b) => Number(b.createdAt) - Number(a.createdAt)
        )
        setStockHistory(history)
      },
      (error) => {
        console.error('Stock history error:', error)
      }
    )

    return () => unsubscribe()
  }, [user])

  const lowStock = products.filter(
    (product) => Number(product.stock) <= 10
  )

  const totalValue = products.reduce(
    (sum, product) =>
      sum +
      Number(product.price || 0) *
        Number(product.stock || 0),
    0
  )

  const categories = [
    ...new Set(
      products.map((product) => product.category).filter(Boolean)
    ),
  ]

  const filteredProducts = products.filter((product) => {
    const keyword = search.toLowerCase()

    const matchesSearch =
      String(product.name || '').toLowerCase().includes(keyword) ||
      String(product.id || '').toLowerCase().includes(keyword)

    const matchesCategory =
      category === 'ทั้งหมด' || product.category === category

    return matchesSearch && matchesCategory
  })

  // แก้ไขสินค้า
  async function handleEditProduct(product) {
    const name = window.prompt('ชื่อสินค้า', product.name)
    if (name === null) return

    if (!name.trim()) {
      window.alert('กรุณากรอกชื่อสินค้า')
      return
    }

    const price = window.prompt('ราคา/หน่วย', product.price)
    if (price === null) return

    const stock = window.prompt('จำนวนคงเหลือ', product.stock)
    if (stock === null) return

    const productCategory = window.prompt(
      'หมวดหมู่',
      product.category
    )
    if (productCategory === null) return

    const unit = window.prompt('หน่วยนับ', product.unit || 'ชิ้น')
    if (unit === null) return

    if (
      price.trim() === '' ||
      stock.trim() === '' ||
      !Number.isFinite(Number(price)) ||
      !Number.isFinite(Number(stock)) ||
      Number(price) < 0 ||
      Number(stock) < 0 ||
      !productCategory.trim() ||
      !unit.trim()
    ) {
      window.alert('กรุณากรอกข้อมูลให้ถูกต้อง')
      return
    }

    try {
      await update(ref(database, `products/${product.id}`), {
        name: name.trim(),
        price: Number(price),
        stock: Number(stock),
        category: productCategory.trim(),
        unit: unit.trim(),
      })

      window.alert('แก้ไขสินค้าสำเร็จ')
    } catch (error) {
      console.error('Edit product error:', error)
      window.alert('แก้ไขสินค้าไม่สำเร็จ กรุณาตรวจสอบ Firebase')
    }
  }

  // ลบสินค้า
  async function handleDeleteProduct(product) {
    const confirmed = window.confirm(
      `ต้องการลบสินค้า "${product.name}" ใช่หรือไม่?`
    )

    if (!confirmed) return

    try {
      await remove(ref(database, `products/${product.id}`))
      window.alert('ลบสินค้าสำเร็จ')
    } catch (error) {
      console.error('Delete product error:', error)
      window.alert('ลบสินค้าไม่สำเร็จ กรุณาตรวจสอบ Firebase')
    }
  }

  // เพิ่มสินค้าใหม่
  async function addProduct(event) {
    event.preventDefault()

    if (
      !form.name.trim() ||
      form.price === '' ||
      form.stock === '' ||
      !Number.isFinite(Number(form.price)) ||
      !Number.isFinite(Number(form.stock)) ||
      Number(form.price) < 0 ||
      Number(form.stock) < 0
    ) {
      window.alert('กรุณากรอกข้อมูลสินค้าให้ถูกต้อง')
      return
    }

    const newId = `P${String(Date.now()).slice(-8)}`

    const newProduct = {
      ...form,
      id: newId,
      name: form.name.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      unit: form.unit.trim() || 'ชิ้น',
    }

    try {
      await set(ref(database, `products/${newId}`), newProduct)

      setForm({
        name: '',
        category: 'เครื่องดื่ม',
        price: '',
        stock: '',
        unit: 'ชิ้น',
        imageUrl: '',
      })

      setShowForm(false)
      setActivePage('products')
      setSearch('')
      setCategory('ทั้งหมด')
    } catch (error) {
      console.error('Save product error:', error)
      window.alert(
        'บันทึกสินค้าไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ Firebase'
      )
    }
  }

  // รับสินค้าเข้าและเบิกสินค้าออก
  async function handleStockSubmit(event) {
    event.preventDefault()

    const quantity = Number(stockQuantity)
    const product = products.find(
      (item) => item.id === stockProductId
    )

    if (!product) {
      window.alert('กรุณาเลือกสินค้า')
      return
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      window.alert('จำนวนต้องเป็นจำนวนเต็มมากกว่า 0')
      return
    }

    const currentStock = Number(product.stock || 0)
    const nextStock =
      stockAction === 'in'
        ? currentStock + quantity
        : currentStock - quantity

    if (nextStock < 0) {
      window.alert('จำนวนเบิกมากกว่าสินค้าคงเหลือ')
      return
    }

    setStockSubmitting(true)

    try {
      const historyId = `SH${Date.now()}`
      const createdAt = Date.now()

      await update(ref(database, `products/${product.id}`), {
        stock: nextStock,
      })

      await set(ref(database, `stockHistory/${historyId}`), {
        id: historyId,
        productId: product.id,
        productName: product.name,
        action: stockAction,
        quantity,
        previousStock: currentStock,
        nextStock,
        note: stockNote.trim(),
        createdAt,
        userEmail: user?.email || '',
      })

      setStockQuantity('')
      setStockNote('')

      window.alert(
        stockAction === 'in'
          ? 'บันทึกรับสินค้าเข้าสำเร็จ'
          : 'บันทึกเบิกสินค้าออกสำเร็จ'
      )
    } catch (error) {
      console.error('Stock transaction error:', error)
      window.alert(
        'บันทึกรายการไม่สำเร็จ กรุณาตรวจสอบ Firebase'
      )
    } finally {
      setStockSubmitting(false)
    }
  }

  // เนื้อหาของแต่ละหน้า
  function renderContent() {
    // หน้าหมวดหมู่สินค้า
    if (activePage === 'categories') {
      return (
        <>
          <div className="page-heading">
            <div>
              <h2>หมวดหมู่สินค้า</h2>
              <p>จัดการหมวดหมู่สินค้าภายในร้าน</p>
            </div>
          </div>

          <div className="category-grid">
            {categories.map((item, index) => (
              <button
                className="category-card"
                key={item}
                onClick={() => {
                  setCategory(item)
                  setSearch('')
                  setActivePage('products')
                }}
              >
                <span className="category-icon">
                  {['🥤', '🍪', '🍜', '🧂', '🧹', '🧴'][index % 6]}
                </span>
                <strong>{item}</strong>
                <span>
                  {products.filter((p) => p.category === item).length}{' '}
                  รายการ
                </span>
              </button>
            ))}
          </div>
        </>
      )
    }

    // หน้ารายงานสินค้า
    if (activePage === 'reports') {
      const categoryReport = categories.map((item) => ({
        name: item,
        count: products.filter((p) => p.category === item).length,
        value: products
          .filter((p) => p.category === item)
          .reduce(
            (sum, p) =>
              sum + Number(p.price || 0) * Number(p.stock || 0),
            0
          ),
      }))

      const inventoryValue = products.reduce(
        (sum, p) =>
          sum + Number(p.price || 0) * Number(p.stock || 0),
        0
      )

      return (
        <>
          <div className="page-heading report-heading">
            <div>
              <h2>รายงานสินค้าคงคลัง</h2>
              <p>ภาพรวมจำนวนสินค้า สถานะสต็อก และมูลค่าสินค้าภายในร้าน</p>
            </div>
          </div>

          {loading ? (
            <div className="panel">
              <div className="empty-state">กำลังโหลดรายงาน...</div>
            </div>
          ) : firebaseError ? (
            <div className="panel">
              <div className="empty-state">{firebaseError}</div>
            </div>
          ) : (
            <>
              <div className="stats-grid report-stats">
                <StatCard
                  icon="▦"
                  label="สินค้าทั้งหมด"
                  value={`${products.length} รายการ`}
                />
                <StatCard
                  icon="!"
                  label="สินค้าใกล้หมด"
                  value={`${lowStock.length} รายการ`}
                  warning={lowStock.length > 0}
                />
                <StatCard
                  icon="฿"
                  label="มูลค่าสินค้าคงคลัง"
                  value={`฿${inventoryValue.toLocaleString('th-TH', {
                    maximumFractionDigits: 2,
                  })}`}
                />
                <StatCard
                  icon="▤"
                  label="หมวดหมู่สินค้า"
                  value={`${categories.length} หมวดหมู่`}
                />
              </div>

              <div className="report-layout">
                <section className="panel report-panel">
                  <div className="report-section-heading">
                    <div>
                      <h3>สินค้าแยกตามหมวดหมู่</h3>
                      <p>เปรียบเทียบจำนวนสินค้าในแต่ละหมวดหมู่</p>
                    </div>
                  </div>

                  {categoryReport.length === 0 ? (
                    <div className="empty-state">
                      ยังไม่มีข้อมูลหมวดหมู่สินค้า
                    </div>
                  ) : (
                    <div className="report-category-list">
                      {categoryReport.map((item) => {
                        const percent =
                          products.length > 0
                            ? (item.count / products.length) * 100
                            : 0

                        return (
                          <div className="report-category" key={item.name}>
                            <div className="report-category-top">
                              <strong>{item.name}</strong>
                              <span>{item.count} รายการ</span>
                            </div>
                            <div className="report-progress">
                              <div
                                className="report-progress-fill"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <div className="report-category-value">
                              มูลค่าสินค้า ฿
                              {item.value.toLocaleString('th-TH', {
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>

                <section className="panel report-panel">
                  <div className="report-section-heading">
                    <div>
                      <h3>สถานะสินค้าคงเหลือ</h3>
                      <p>ตรวจสอบสินค้าที่ควรเติมสต็อก</p>
                    </div>
                  </div>

                  <div className="report-status-summary">
                    <div className="report-status-row">
                      <span className="report-status-dot normal-dot" />
                      <span>สต็อกปกติ</span>
                      <strong>
                        {
                          products.filter((p) => Number(p.stock) > 10)
                            .length
                        }
                      </strong>
                    </div>
                    <div className="report-status-row">
                      <span className="report-status-dot low-dot" />
                      <span>สินค้าใกล้หมด</span>
                      <strong>
                        {
                          products.filter(
                            (p) =>
                              Number(p.stock) > 5 &&
                              Number(p.stock) <= 10
                          ).length
                        }
                      </strong>
                    </div>
                    <div className="report-status-row">
                      <span className="report-status-dot out-dot" />
                      <span>สินค้าเหลือน้อยมาก</span>
                      <strong>
                        {
                          products.filter((p) => Number(p.stock) <= 5)
                            .length
                        }
                      </strong>
                    </div>
                  </div>

                  <div className="report-tip">
                    <strong>ควรตรวจสอบ</strong>
                    <p>
                      {lowStock.length > 0
                        ? `มีสินค้า ${lowStock.length} รายการที่มีจำนวนคงเหลือไม่เกิน 10 หน่วย`
                        : 'ขณะนี้ยังไม่มีสินค้าที่เข้าเกณฑ์สินค้าใกล้หมด'}
                    </p>
                    <button
                      type="button"
                      className="report-text-button"
                      onClick={() => setActivePage('stock')}
                    >
                      ไปหน้าจัดการสต็อก →
                    </button>
                  </div>
                </section>
              </div>

              <section className="panel report-panel report-table-panel">
                <div className="report-section-heading">
                  <div>
                    <h3>รายการสินค้าใกล้หมด</h3>
                    <p>สินค้าที่มีจำนวนคงเหลือไม่เกิน 10 หน่วย</p>
                  </div>
                  <span className="report-count">
                    {lowStock.length} รายการ
                  </span>
                </div>

                <ProductTable
                  products={lowStock}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                />
              </section>

              <section className="panel report-panel report-table-panel">
                <div className="report-section-heading">
                  <div>
                    <h3>มูลค่าสินค้าตามรายการ</h3>
                    <p>คำนวณจากราคาต่อหน่วยคูณจำนวนคงเหลือ</p>
                  </div>
                </div>

                {products.length === 0 ? (
                  <div className="empty-state">ยังไม่มีข้อมูลสินค้า</div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>รหัสสินค้า</th>
                          <th>ชื่อสินค้า</th>
                          <th>หมวดหมู่</th>
                          <th>ราคาต่อหน่วย</th>
                          <th>จำนวนคงเหลือ</th>
                          <th>มูลค่ารวม</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...products]
                          .sort(
                            (a, b) =>
                              Number(b.price || 0) * Number(b.stock || 0) -
                              Number(a.price || 0) * Number(a.stock || 0)
                          )
                          .map((product) => (
                            <tr key={product.id}>
                              <td className="product-id">{product.id}</td>
                              <td className="product-name">{product.name}</td>
                              <td>
                                <span className="category-tag">
                                  {product.category}
                                </span>
                              </td>
                              <td>
                                ฿
                                {Number(product.price || 0).toLocaleString(
                                  'th-TH'
                                )}
                              </td>
                              <td>
                                {product.stock} {product.unit}
                              </td>
                              <td className="report-total-value">
                                ฿
                                {(
                                  Number(product.price || 0) *
                                  Number(product.stock || 0)
                                ).toLocaleString('th-TH', {
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </>
      )
    }
    
    // หน้าจัดการสต็อก
    if (activePage === 'stock') {
      return (
        <>
          <div className="page-heading">
            <div>
              <h2>จัดการสต็อกสินค้า</h2>
              <p>บันทึกรับเข้า เบิกออก และตรวจสอบประวัติสินค้า</p>
            </div>
          </div>

          <div className="panel">
            <h3>บันทึกรายการสต็อก</h3>

            <form onSubmit={handleStockSubmit}>
              <label>
                ประเภทการทำรายการ
                <select
                  value={stockAction}
                  onChange={(e) => setStockAction(e.target.value)}
                >
                  <option value="in">รับสินค้าเข้า</option>
                  <option value="out">เบิกสินค้าออก</option>
                </select>
              </label>

              <label>
                เลือกสินค้า
                <select
                  required
                  value={stockProductId}
                  onChange={(e) => setStockProductId(e.target.value)}
                >
                  <option value="">-- เลือกสินค้า --</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (คงเหลือ {product.stock} {product.unit})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                จำนวน
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  placeholder="กรอกจำนวน"
                />
              </label>

              <label>
                หมายเหตุ
                <input
                  value={stockNote}
                  onChange={(e) => setStockNote(e.target.value)}
                  placeholder="เช่น รับสินค้าจากผู้จำหน่าย"
                />
              </label>

              <button
                className="primary-button"
                type="submit"
                disabled={stockSubmitting || loading}
              >
                {stockSubmitting
                  ? 'กำลังบันทึก...'
                  : stockAction === 'in'
                    ? 'บันทึกรับเข้า'
                    : 'บันทึกเบิกออก'}
              </button>
            </form>
          </div>

          <div className="panel">
            <h3>ประวัติการเคลื่อนไหวสต็อก</h3>

            {stockHistory.length === 0 ? (
              <div className="empty-state">
                ยังไม่มีประวัติการทำรายการ
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>วันที่</th>
                      <th>สินค้า</th>
                      <th>ประเภท</th>
                      <th>จำนวน</th>
                      <th>ก่อนทำรายการ</th>
                      <th>หลังทำรายการ</th>
                      <th>หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockHistory.map((item) => (
                      <tr key={item.id}>
                        <td>
                          {new Date(
                            Number(item.createdAt)
                          ).toLocaleString('th-TH')}
                        </td>
                        <td>{item.productName}</td>
                        <td>
                          {item.action === 'in' ? 'รับเข้า' : 'เบิกออก'}
                        </td>
                        <td>{item.quantity}</td>
                        <td>{item.previousStock}</td>
                        <td>{item.nextStock}</td>
                        <td>{item.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="panel">
            <h3>สินค้าใกล้หมด</h3>
            {loading ? (
              <div className="empty-state">กำลังโหลดข้อมูลสินค้า...</div>
            ) : firebaseError ? (
              <div className="empty-state">{firebaseError}</div>
            ) : (
              <ProductTable
                products={lowStock}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
              />
            )}
          </div>
        </>
      )
    }

    // หน้าจัดการผู้ใช้งาน
    if (activePage === 'users') {
      return (
        <>
          <div className="page-heading">
            <div>
              <h2>จัดการผู้ใช้งาน</h2>
              <p>ข้อมูลบัญชีที่เข้าสู่ระบบในปัจจุบัน</p>
            </div>
          </div>

          <section className="panel">
            <h3>ข้อมูลผู้ใช้งาน</h3>
            <div className="user-info-grid">
              <div className="user-info-item">
                <span className="user-info-label">อีเมล</span>
                <strong>{user?.email || 'ไม่พบอีเมลผู้ใช้งาน'}</strong>
              </div>
              <div className="user-info-item">
                <span className="user-info-label">สถานะบัญชี</span>
                <strong>เข้าสู่ระบบแล้ว</strong>
              </div>
              <div className="user-info-item">
                <span className="user-info-label">รหัสผู้ใช้งาน</span>
                <strong>{user?.uid || '-'}</strong>
              </div>
            </div>
          </section>
        </>
      )
    }

    // หน้าตั้งค่าระบบ
    if (activePage === 'settings') {
      return (
        <>
          <div className="page-heading">
            <div>
              <h2>ตั้งค่าระบบ</h2>
              <p>ข้อมูลทั่วไปและสถานะการเชื่อมต่อของระบบ</p>
            </div>
          </div>

          <section className="panel">
            <h3>ข้อมูลระบบ</h3>
            <div className="user-info-grid">
              <div className="user-info-item">
                <span className="user-info-label">ชื่อระบบ</span>
                <strong>RETAIL INVENTORY</strong>
              </div>
              <div className="user-info-item">
                <span className="user-info-label">ประเภทระบบ</span>
                <strong>ระบบบริหารสินค้าคงคลังสำหรับร้านค้าปลีก</strong>
              </div>
              <div className="user-info-item">
                <span className="user-info-label">บัญชีที่ใช้งาน</span>
                <strong>{user?.email || '-'}</strong>
              </div>
              <div className="user-info-item">
                <span className="user-info-label">ข้อมูลสินค้า</span>
                <strong>{loading ? 'กำลังตรวจสอบ...' : firebaseError ? 'ตรวจสอบการเชื่อมต่อ' : 'โหลดข้อมูลแล้ว'}</strong>
              </div>
            </div>
          </section>
        </>
      )
    }

    // หน้าหลัก หน้าจัดการสินค้า และหน้าค้นหาสินค้า
    const isDashboard = activePage === 'dashboard'
    const isSearch = activePage === 'search'
    const isProducts = activePage === 'products'

    return (
      <>
        <div className="page-heading">
          <div>
            <h2>
              {isDashboard
                ? 'หน้าหลัก'
                : isSearch
                  ? 'ค้นหาสินค้า'
                  : 'จัดการสินค้า'}
            </h2>
            <p>
              {isDashboard
                ? 'ภาพรวมระบบบริหารสินค้าคงคลัง'
                : isSearch
                  ? 'ค้นหาสินค้าจากชื่อหรือรหัสสินค้า'
                  : 'เพิ่ม แก้ไข และจัดการข้อมูลสินค้า'}
            </p>
          </div>

          {!isSearch && (
            <button
              className="primary-button"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'ยกเลิก' : '+ เพิ่มสินค้า'}
            </button>
          )}
        </div>

        {isDashboard && (
          <div className="stats-grid">
            <StatCard
              icon="▦"
              label="สินค้าทั้งหมด"
              value={`${products.length} รายการ`}
            />
            <StatCard
              icon="!"
              label="สินค้าใกล้หมด"
              value={`${lowStock.length} รายการ`}
              warning={lowStock.length > 0}
            />
            <StatCard
              icon="฿"
              label="มูลค่าสินค้ารวม"
              value={`฿${totalValue.toLocaleString()}`}
            />
            <StatCard
              icon="▤"
              label="หมวดหมู่สินค้า"
              value={`${categories.length} หมวดหมู่`}
            />
          </div>
        )}

        {showForm && !isSearch && (
          <div className="panel">
            <h3>เพิ่มสินค้าใหม่</h3>

            <form onSubmit={addProduct}>
              <label>
                ชื่อสินค้า
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="กรอกชื่อสินค้า"
                />
              </label>

              <label>
                URL รูปภาพสินค้า
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm({ ...form, imageUrl: e.target.value })
                  }
                  placeholder="https://example.com/product.jpg"
                />
              </label>

              <label>
                หมวดหมู่
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  <option value="เครื่องดื่ม">เครื่องดื่ม</option>
                  <option value="ขนม">ขนม</option>
                  <option value="อาหาร">อาหาร</option>
                  <option value="ของใช้">ของใช้</option>
                  <option value="เครื่องปรุง">เครื่องปรุง</option>
                  {categories
                    .filter(
                      (item) =>
                        ![
                          'เครื่องดื่ม',
                          'ขนม',
                          'อาหาร',
                          'ของใช้',
                          'เครื่องปรุง',
                        ].includes(item)
                    )
                    .map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                </select>
              </label>

              <label>
                ราคา/หน่วย
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                  placeholder="0.00"
                />
              </label>

              <label>
                จำนวนเริ่มต้น
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={form.stock}
                  onChange={(e) =>
                    setForm({ ...form, stock: e.target.value })
                  }
                  placeholder="0"
                />
              </label>

              <label>
                หน่วยนับ
                <input
                  required
                  value={form.unit}
                  onChange={(e) =>
                    setForm({ ...form, unit: e.target.value })
                  }
                  placeholder="ชิ้น"
                />
              </label>

              <button
                className="primary-button"
                type="submit"
                disabled={loading}
              >
                บันทึกสินค้า
              </button>
            </form>
          </div>
        )}

        {isSearch && (
          <div className="panel">
            <h3>ค้นหาสินค้า</h3>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="พิมพ์ชื่อหรือรหัสสินค้า..."
            />
          </div>
        )}

        {(isProducts || isSearch) && (
          <div className="panel">
            <div className="page-heading">
              <div>
                <h3>รายการสินค้า</h3>
                <p>พบ {filteredProducts.length} รายการ</p>
              </div>
            </div>

            <label>
              กรองตามหมวดหมู่
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="ทั้งหมด">ทุกหมวดหมู่</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            {loading ? (
              <div className="empty-state">กำลังโหลดข้อมูลสินค้า...</div>
            ) : firebaseError ? (
              <div className="empty-state">{firebaseError}</div>
            ) : (
              <ProductTable
                products={filteredProducts}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
              />
            )}
          </div>
        )}

        {isDashboard && (
          <div className="panel">
            <h3>สินค้าใกล้หมด</h3>
            {loading ? (
              <div className="empty-state">กำลังโหลดข้อมูลสินค้า...</div>
            ) : firebaseError ? (
              <div className="empty-state">{firebaseError}</div>
            ) : (
              <ProductTable
                products={lowStock}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
              />
            )}
          </div>
        )}
      </>
    )
  }

  // ตรวจสอบการเข้าสู่ระบบก่อนแสดงแอป
  if (authLoading) {
    return <div className="login-page">กำลังตรวจสอบบัญชีผู้ใช้...</div>
  }

  if (!user) {
    return <Login />
  }

  // โครงสร้างหลักของระบบ
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img
          src={logo}
          alt="Retail Inventory"
          className="sidebar-logo"
          />
          <div className="brand-text">
            <strong>RETAIL</strong>
            <strong>INVENTORY</strong>
            <small>INVENTORY MANAGEMENT</small>
            </div>
          </div>

        <div className="store-label">เมนูหลัก</div>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => {
                setActivePage(item.id)
                setShowForm(false)
                if (item.id !== 'products' && item.id !== 'search') {
                  setSearch('')
                  setCategory('ทั้งหมด')
                }
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.id === 'stock' && lowStock.length > 0 && (
                <span className="nav-badge">{lowStock.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <div>
              <strong>RETAIL INVENTORY</strong>
              <small>ระบบบริหารสินค้าคงคลังสำหรับร้านค้าปลีก</small>
            </div>
          </div>

          <div className="profile">
            <span className="avatar">
              {(user.email || 'A').charAt(0).toUpperCase()}
            </span>
            <div className="profile-info">
              <strong>{user.email || 'ผู้ใช้งาน'}</strong>
              <small>ผู้ใช้งานระบบ</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            ระบบจัดการ <span>/</span>
            <strong>
              {menuItems.find((item) => item.id === activePage)?.label || 'หน้าหลัก'}
            </strong>
          </div>

          <div className="topbar-right">
            <span className="today-label">
              {new Date().toLocaleDateString('th-TH', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span className="top-avatar">
              {(user.email || 'A').charAt(0).toUpperCase()}
            </span>
            <button
              type="button"
              className="logout-button"
              onClick={async () => {
                try {
                  await signOut(auth)
                } catch (error) {
                  console.error('Logout error:', error)
                  window.alert('ออกจากระบบไม่สำเร็จ')
                }
              }}
            >
              ออกจากระบบ
            </button>
          </div>
        </header>

        <div className="content-area">{renderContent()}</div>
        <footer>© 2026 RETAIL INVENTORY</footer>
      </main>
    </div>
  )
}

function StatCard({ icon, label, value, detail, warning }) {
  return (
    <div className={`stat-card ${warning ? 'warning-card' : ''}`}>
      <span className="stat-icon">{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {detail && <small>{detail}</small>}
      </div>
    </div>
  )
}

function getProductImage(product) {
  const number = String(product.id || '').match(/\d+/)?.[0]

  if (!number) return null

  const imageNumber = number.padStart(3, '0')

  return `/images/p${imageNumber}.webp`
}

function ProductTable({ products, onEdit, onDelete }) {
  if (products.length === 0) {
    return <div className="empty-state">ไม่พบข้อมูลสินค้า</div>
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>รูปภาพ</th>
            <th>รหัสสินค้า</th>
            <th>ชื่อสินค้า</th>
            <th>หมวดหมู่</th>
            <th>ราคา/หน่วย</th>
            <th>คงเหลือ</th>
            <th>สถานะ</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                {getProductImage(product) ? (
                  <img
                    src={getProductImage(product)}
                    alt={product.name || 'รูปสินค้า'}
                    className="product-thumbnail"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <span className="product-no-image">ไม่มีรูป</span>
                )}
              </td>
              <td className="product-id">{product.id}</td>
              <td className="product-name">{product.name}</td>
              <td>
                <span className="category-tag">{product.category}</span>
              </td>
              <td>฿{Number(product.price).toLocaleString()}</td>
              <td>
                {product.stock} {product.unit}
              </td>
              <td>
                <span
                  className={`stock-status ${
                    Number(product.stock) <= 5
                      ? 'out'
                      : Number(product.stock) <= 10
                        ? 'low'
                        : 'normal'
                  }`}
                >
                  {Number(product.stock) <= 5
                    ? 'ใกล้หมดมาก'
                    : Number(product.stock) <= 10
                      ? 'ใกล้หมด'
                      : 'ปกติ'}
                </span>
              </td>
              <td>
                <div className="product-actions">
                  <button
                    type="button"
                    onClick={() => onEdit?.(product)}
                    title="แก้ไขสินค้า"
                  >
                    ✏️ แก้ไข
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete?.(product)}
                    title="ลบสินค้า"
                  >
                    🗑️ ลบ
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App
