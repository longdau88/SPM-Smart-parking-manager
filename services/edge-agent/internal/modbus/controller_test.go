package modbus

import (
	"errors"
	"testing"
)

type mockDevice struct {
	loop1  bool
	loop2  bool
	writes []uint16
	err    error
}

func (m *mockDevice) Open() error  { return nil }
func (m *mockDevice) Close() error { return nil }
func (m *mockDevice) ReadDiscreteInputs(address, quantity uint16) ([]byte, error) {
	value := byte(0)
	if m.loop1 {
		value |= 0x01
	}
	if m.loop2 {
		value |= 0x02
	}
	return []byte{value}, nil
}
func (m *mockDevice) WriteSingleCoil(address, value uint16) error {
	m.writes = append(m.writes, address)
	return m.err
}

func TestCloseBarrierBlockedByLoop2(t *testing.T) {
	device := &mockDevice{loop1: true, loop2: true}
	controller := NewController(device)

	err := controller.CloseBarrier()
	if err == nil {
		t.Fatal("expected anti-smash interlock error")
	}
	if len(device.writes) != 1 || device.writes[0] != CoilBarrierLock {
		t.Fatalf("expected force-lock coil, writes=%v", device.writes)
	}
}

func TestCloseBarrierWhenLoop2Clear(t *testing.T) {
	device := &mockDevice{loop1: true, loop2: false}
	controller := NewController(device)

	if err := controller.CloseBarrier(); err != nil {
		t.Fatal(err)
	}
	if len(device.writes) != 1 || device.writes[0] != CoilBarrierClose {
		t.Fatalf("expected close coil, writes=%v", device.writes)
	}
}

func TestModbusWriteError(t *testing.T) {
	device := &mockDevice{err: errors.New("timeout")}
	controller := NewController(device)
	if err := controller.OpenBarrier(); err == nil {
		t.Fatal("expected write error")
	}
}
